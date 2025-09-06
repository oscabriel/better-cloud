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
		origin: env.TRUSTED_ORIGINS || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.route("/api/counter", counterRouter);
app.route("/api/connection-count", connectionCounterRouter);

export default app;
