/// <reference path="../../../worker-configuration.d.ts" />
import type {
	Request as CfRequest,
	DurableObjectNamespace,
} from "@cloudflare/workers-types";
import { Hono } from "hono";

// Environment type for ConnectionCounter router
type ConnectionCounterEnv = {
	Bindings: {
		CONNECTION_COUNTER: DurableObjectNamespace;
	};
	Variables: Record<string, never>;
};

const connectionCounterRouter = new Hono<ConnectionCounterEnv>();

// HTTP endpoint to get current connection count
connectionCounterRouter.get("/", async (c) => {
	try {
		const id = c.env.CONNECTION_COUNTER.idFromName("global-connection-counter");
		const stub = c.env.CONNECTION_COUNTER.get(id);
		const response = await stub.fetch("http://connection-counter.do/");
		if (!response.ok) {
			throw new Error(`ConnectionCounter service error: ${response.status}`);
		}
		const data = (await response.json()) as { count: number };
		return c.json(data);
	} catch (error) {
		console.error("Get connection count error:", error);
		return c.json({ error: "Failed to get connection count" }, 500);
	}
});

// WebSocket endpoint for real-time connection count updates
connectionCounterRouter.get("/websocket", async (c) => {
	try {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
			return new Response("Expected Upgrade: websocket", {
				status: 426,
				headers: {
					Upgrade: "websocket",
					"Content-Type": "text/plain",
				},
			});
		}

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

		const wsKey = c.req.header("Sec-WebSocket-Key");
		if (!wsKey) {
			return new Response("Missing Sec-WebSocket-Key header", {
				status: 400,
				headers: {
					"Content-Type": "text/plain",
				},
			});
		}

		const id = c.env.CONNECTION_COUNTER.idFromName("global-connection-counter");
		const stub = c.env.CONNECTION_COUNTER.get(id);

		// Forward the request to the Durable Object for upgrade
		const response = (await stub.fetch(
			c.req.raw as unknown as CfRequest,
		)) as unknown as Response;
		return response;
	} catch (error) {
		console.error("WebSocket upgrade error (ConnectionCounter):", error);
		return new Response("Failed to upgrade to WebSocket", {
			status: 500,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
});

export { connectionCounterRouter };
