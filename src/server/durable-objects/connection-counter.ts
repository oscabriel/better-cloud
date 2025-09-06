import { DurableObject } from "cloudflare:workers";

export class ConnectionCounter extends DurableObject<Env> {
	private broadcastConnectionCount() {
		const sockets = this.ctx.getWebSockets("connection-updates");
		const count = sockets.length;
		const msg = JSON.stringify({
			type: "connection-count",
			count,
			timestamp: Date.now(),
		});

		for (const socket of sockets) {
			if (socket.readyState === WebSocket.OPEN) {
				try {
					socket.send(msg);
				} catch (error) {
					console.error("ConnectionCounter broadcast error:", error);
				}
			}
		}
	}

	async fetch(request: Request): Promise<Response> {
		const upgradeHeader = request.headers.get("Upgrade");
		if (upgradeHeader === "websocket") {
			try {
				console.debug(
					"Processing WebSocket upgrade request (ConnectionCounter)",
				);
				const sockets = this.ctx.getWebSockets("connection-updates");
				const currentConnections = sockets.length;
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
				const webSocketPair = new WebSocketPair();
				const [client, server] = Object.values(webSocketPair);
				this.ctx.acceptWebSocket(server, ["connection-updates"]);
				console.debug("WebSocket accepted successfully (ConnectionCounter)");

				// Broadcast updated count after accepting new connection
				setTimeout(() => this.broadcastConnectionCount(), 0);

				return new Response(null, { status: 101, webSocket: client });
			} catch (error) {
				console.error(
					"Error during WebSocket upgrade (ConnectionCounter):",
					error,
				);
				return new Response("WebSocket upgrade failed", {
					status: 500,
					headers: { "Content-Type": "text/plain" },
				});
			}
		}
		if (request.method === "GET") {
			const count = this.ctx.getWebSockets("connection-updates").length;
			return new Response(JSON.stringify({ count }), {
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response("Method not allowed", { status: 405 });
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		try {
			if (message === "ping") {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send("pong");
				}
				return;
			}
			const messageStr =
				typeof message === "string"
					? message
					: new TextDecoder().decode(message);
			if (!messageStr.startsWith("{")) {
				return;
			}
			const data = JSON.parse(messageStr);
			if (data.type === "subscribe" || data.type === "unsubscribe") {
				this.broadcastConnectionCount();
			}
		} catch (error) {
			console.error("WebSocket message error (ConnectionCounter):", error);
		}
	}

	async webSocketClose(
		_ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		console.debug(
			`WebSocket closed (ConnectionCounter): code=${code}, reason=${reason}, wasClean=${wasClean}`,
		);

		// Use setTimeout to ensure the WebSocket is fully removed from hibernation state
		// before counting remaining connections. This fixes timing issues in production
		// where the hibernation API may not immediately remove the closed WebSocket.
		setTimeout(() => this.broadcastConnectionCount(), 10);
	}

	async webSocketError(_ws: WebSocket, error: unknown) {
		console.error("WebSocket error in ConnectionCounter DO:", error);

		// Also broadcast count in case of errors to ensure consistency
		setTimeout(() => this.broadcastConnectionCount(), 10);
	}
}
