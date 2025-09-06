import { DurableObject } from "cloudflare:workers";
import type { CounterState } from "../lib/types";

export class Counter extends DurableObject<Env> {
	private value = 0;
	private totalIncrements = 0;
	private totalDecrements = 0;
	private lastUpdated = 0;
	private lastUpdater: string | null = null;
	private initialized = false;

	private async ensureInitialized(): Promise<void> {
		if (this.initialized) return;

		try {
			// Initialize SQLite table if needed - this is idempotent
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS counter_state (
					id INTEGER PRIMARY KEY,
					value INTEGER NOT NULL DEFAULT 0,
					total_increments INTEGER NOT NULL DEFAULT 0,
					total_decrements INTEGER NOT NULL DEFAULT 0,
					last_updated INTEGER NOT NULL DEFAULT 0,
					last_updater TEXT
				);
				INSERT OR IGNORE INTO counter_state (id, value, total_increments, total_decrements, last_updated, last_updater)
				VALUES (1, 0, 0, 0, 0, NULL);
			`);

			// Load current state with simple query
			const stored = this.ctx.storage.sql
				.exec("SELECT * FROM counter_state WHERE id = 1")
				.one() as {
				value: number;
				total_increments: number;
				total_decrements: number;
				last_updated: number;
				last_updater: string | null;
			} | null;

			if (stored) {
				this.value = stored.value;
				this.totalIncrements = stored.total_increments;
				this.totalDecrements = stored.total_decrements;
				this.lastUpdated = stored.last_updated;
				this.lastUpdater = stored.last_updater;
			}

			this.initialized = true;
			console.debug("Counter Durable Object initialized successfully");
		} catch (error) {
			console.error("Failed to initialize Counter Durable Object:", error);
			throw new Error("Counter initialization failed");
		}
	}

	async fetch(request: Request): Promise<Response> {
		await this.ensureInitialized();

		const url = new URL(request.url);
		const upgradeHeader = request.headers.get("Upgrade");

		if (upgradeHeader === "websocket") {
			try {
				console.debug("Processing WebSocket upgrade request");

				// Check WebSocket connection limit (32,768 per Durable Object)
				const currentConnections =
					this.ctx.getWebSockets("counter-updates").length;
				if (currentConnections >= 32768) {
					console.warn(
						`WebSocket connection limit reached: ${currentConnections}`,
					);
					return new Response("Too many WebSocket connections", {
						status: 503,
						headers: {
							"Content-Type": "text/plain",
							"Retry-After": "60",
						},
					});
				}

				// Create WebSocket pair
				const webSocketPair = new WebSocketPair();
				const [client, server] = Object.values(webSocketPair);

				// Use hibernation API - this is the key difference from standard WebSocket API
				this.ctx.acceptWebSocket(server, ["counter-updates"]);

				console.debug("WebSocket accepted successfully");

				return new Response(null, {
					status: 101,
					webSocket: client,
				});
			} catch (error) {
				console.error("Error during WebSocket upgrade:", error);
				return new Response("WebSocket upgrade failed", {
					status: 500,
					headers: {
						"Content-Type": "text/plain",
					},
				});
			}
		}

		// Handle HTTP requests for counter operations
		try {
			if (request.method === "GET") {
				return this.handleGetCounter();
			}
			if (request.method === "POST") {
				// For POST routes, parse JSON body
				const body = (await request.json()) as {
					amount?: number;
					username?: string;
				};
				switch (url.pathname) {
					case "/increment":
						return await this.handleIncrement(body.amount || 1, body.username);
					case "/decrement":
						return await this.handleDecrement(body.amount || 1, body.username);
					default:
						return new Response("Not found", { status: 404 });
				}
			}

			return new Response("Method not allowed", { status: 405 });
		} catch (error) {
			console.error("Counter error:", error);
			return new Response("Internal server error", { status: 500 });
		}
	}

	private async handleGetCounter(): Promise<Response> {
		const state: CounterState = {
			value: this.value,
			lastUpdated: this.lastUpdated,
			totalIncrements: this.totalIncrements,
			totalDecrements: this.totalDecrements,
			lastUpdater: this.lastUpdater,
		};

		return new Response(JSON.stringify(state), {
			headers: { "Content-Type": "application/json" },
		});
	}

	private async handleIncrement(
		amount = 1,
		username?: string,
	): Promise<Response> {
		this.value += amount;
		this.totalIncrements += amount;
		this.lastUpdated = Date.now();

		// Record last updater
		this.lastUpdater = username ?? null;

		await this.persistState();
		this.broadcastCounterUpdate();

		return this.handleGetCounter();
	}

	private async handleDecrement(
		amount = 1,
		username?: string,
	): Promise<Response> {
		this.value -= amount;
		this.totalDecrements += amount;
		this.lastUpdated = Date.now();

		// Record last updater
		this.lastUpdater = username ?? null;

		await this.persistState();
		this.broadcastCounterUpdate();

		return this.handleGetCounter();
	}

	private async persistState(): Promise<void> {
		try {
			this.ctx.storage.sql.exec(
				`UPDATE counter_state
			SET value = ?, total_increments = ?, total_decrements = ?, last_updated = ?, last_updater = ?
			WHERE id = 1`,
				this.value,
				this.totalIncrements,
				this.totalDecrements,
				this.lastUpdated,
				this.lastUpdater,
			);
		} catch (error) {
			console.error("Failed to persist counter state:", error);
			throw new Error("State persistence failed");
		}
	}

	// WebSocket hibernation event handlers - these replace addEventListener
	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		try {
			// Handle ping messages immediately without initialization
			if (message === "ping") {
				ws.send("pong");
				return;
			}

			// For other messages, ensure initialization
			await this.ensureInitialized();

			// Handle string messages
			const messageStr =
				typeof message === "string"
					? message
					: new TextDecoder().decode(message);

			// Parse JSON messages only - early return for non-JSON
			if (!messageStr.startsWith("{")) {
				return;
			}

			const data = JSON.parse(messageStr);

			if (data.type === "subscribe") {
				// Send current counter state to new subscriber
				const stateMessage = JSON.stringify({
					type: "counter-state",
					data: {
						value: this.value,
						lastUpdated: this.lastUpdated,
						totalIncrements: this.totalIncrements,
						totalDecrements: this.totalDecrements,
						lastUpdater: this.lastUpdater,
					},
					timestamp: Date.now(),
				});

				ws.send(stateMessage);
			}
		} catch (error) {
			console.error("WebSocket message error:", error);
			// Don't rethrow the error to prevent connection closure
		}
	}

	async webSocketClose(
		_ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		console.debug(
			`WebSocket closed: code=${code}, reason="${reason}", wasClean=${wasClean}`,
		);
	}

	async webSocketError(_ws: WebSocket, error: unknown) {
		console.error("WebSocket error in Durable Object:", error);
	}

	private broadcastCounterUpdate() {
		const sockets = this.ctx.getWebSockets("counter-updates");
		const message = JSON.stringify({
			type: "counter-update",
			data: {
				value: this.value,
				lastUpdated: this.lastUpdated,
				totalIncrements: this.totalIncrements,
				totalDecrements: this.totalDecrements,
				lastUpdater: this.lastUpdater,
			},
			timestamp: Date.now(),
		});

		for (const socket of sockets) {
			try {
				socket.send(message);
			} catch (error) {
				console.error("Broadcast error:", error);
			}
		}
	}
}
