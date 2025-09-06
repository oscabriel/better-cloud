import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppBindings, CounterState } from "../lib/types";

const counterRouter = new Hono<AppBindings>();

// Validation schemas
const incrementSchema = z.object({
	amount: z.number().int().min(1).max(1000).optional().default(1),
});

const decrementSchema = z.object({
	amount: z.number().int().min(1).max(1000).optional().default(1),
});

// Get counter value
counterRouter.get("/", async (c) => {
	try {
		const id = c.env.COUNTER.idFromName("global-counter");
		const stub = c.env.COUNTER.get(id);
		const response = await stub.fetch("http://counter.do/");

		if (!response.ok) {
			throw new Error(`Counter service error: ${response.status}`);
		}

		const data = (await response.json()) as CounterState;
		return c.json(data);
	} catch (error) {
		console.error("Get counter error:", error);
		return c.json({ error: "Failed to get counter" }, 500);
	}
});

// Increment counter
counterRouter.post(
	"/increment",
	zValidator("json", incrementSchema),
	async (c) => {
		try {
			const { amount } = c.req.valid("json");

			// Additional validation to prevent unnecessary DO requests
			if (amount <= 0 || amount > 1000) {
				return c.json(
					{ error: "Invalid amount: must be between 1 and 1000" },
					400,
				);
			}

			const id = c.env.COUNTER.idFromName("global-counter");
			const stub = c.env.COUNTER.get(id);

			// Get user info for lastUpdater tracking
			const user = c.get("user");
			const username =
				user?.name || user?.email?.split("@")[0] || "Anonymous User";

			const response = await stub.fetch("http://counter.do/increment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount,
					username,
				}),
			});

			if (!response.ok) {
				throw new Error(`Counter service error: ${response.status}`);
			}

			const data = (await response.json()) as CounterState;
			return c.json(data);
		} catch (error) {
			console.error("Increment counter error:", error);
			return c.json({ error: "Failed to increment counter" }, 500);
		}
	},
);

// Decrement counter
counterRouter.post(
	"/decrement",
	zValidator("json", decrementSchema),
	async (c) => {
		try {
			const { amount } = c.req.valid("json");

			// Additional validation to prevent unnecessary DO requests
			if (amount <= 0 || amount > 1000) {
				return c.json(
					{ error: "Invalid amount: must be between 1 and 1000" },
					400,
				);
			}

			const id = c.env.COUNTER.idFromName("global-counter");
			const stub = c.env.COUNTER.get(id);

			// Get user info for lastUpdater tracking
			const user = c.get("user");
			const username =
				user?.name || user?.email?.split("@")[0] || "Anonymous User";

			const response = await stub.fetch("http://counter.do/decrement", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount,
					username,
				}),
			});

			if (!response.ok) {
				throw new Error(`Counter service error: ${response.status}`);
			}

			const data = (await response.json()) as CounterState;
			return c.json(data);
		} catch (error) {
			console.error("Decrement counter error:", error);
			return c.json({ error: "Failed to decrement counter" }, 500);
		}
	},
);

// WebSocket endpoint for real-time updates
counterRouter.get("/websocket", async (c) => {
	try {
		// Validate WebSocket upgrade request - required by Cloudflare documentation
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return new Response("Expected Upgrade: websocket", {
				status: 426,
				headers: {
					Upgrade: "websocket",
					"Content-Type": "text/plain",
				},
			});
		}

		// Validate Connection header
		const connectionHeader = c.req.header("Connection");
		if (
			!connectionHeader ||
			!connectionHeader.toLowerCase().includes("upgrade")
		) {
			return new Response("Expected Connection: Upgrade", {
				status: 400,
				headers: {
					"Content-Type": "text/plain",
				},
			});
		}

		// Validate WebSocket key
		const wsKey = c.req.header("Sec-WebSocket-Key");
		if (!wsKey) {
			return new Response("Missing Sec-WebSocket-Key header", {
				status: 400,
				headers: {
					"Content-Type": "text/plain",
				},
			});
		}

		const id = c.env.COUNTER.idFromName("global-counter");
		const stub = c.env.COUNTER.get(id);

		// Forward the original request to the Durable Object for WebSocket upgrade
		return stub.fetch(c.req.raw);
	} catch (error) {
		console.error("WebSocket upgrade error:", error);
		return new Response("Failed to upgrade to WebSocket", {
			status: 500,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
});

export { counterRouter };
