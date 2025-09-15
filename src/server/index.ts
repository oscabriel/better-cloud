import { env } from "cloudflare:workers";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { ConnectionCounter } from "./durable-objects/connection-counter";
import { Counter } from "./durable-objects/counter";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { appRouter } from "./routers";
import { connectionCounterRouter } from "./routers/connection-counter";
import { counterRouter } from "./routers/counter";

// Export Durable Objects
export { Counter, ConnectionCounter };

const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());

app.use(
	"/*",
	cors({
		origin: env.TRUSTED_ORIGINS?.split(",") || [],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Origin",
			"Upgrade",
			"Connection",
			"Sec-WebSocket-Key",
			"Sec-WebSocket-Version",
			"Sec-WebSocket-Protocol",
		],
		credentials: true,
		maxAge: 86400, // 24 hours
	}),
);

app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.route("/counter", counterRouter);
app.route("/connection-count", connectionCounterRouter);

export default app;
