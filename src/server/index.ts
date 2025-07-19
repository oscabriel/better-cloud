import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { ConnectionCounter } from "./durable-objects/connection-counter";
import { Counter } from "./durable-objects/counter";
import type { AppBindings } from "./lib/types";
import authMiddleware from "./middlewares/auth-middleware";
import corsMiddleware from "./middlewares/cors-middleware";
import sessionMiddleware from "./middlewares/session-middleware";
import { appRouter } from "./routers";
import { connectionCounterRouter } from "./routers/connection-counter";
import { counterRouter } from "./routers/counter";

const app = new Hono<AppBindings>({ strict: false });

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", authMiddleware);
app.use("*", corsMiddleware);
app.use("*", sessionMiddleware);

app.on(["POST", "GET"], "/api/auth/**", async (c) => {
	const authInstance = c.get("auth");
	if (!authInstance) {
		throw new Error("Auth instance not found");
	}
	const response = await authInstance.handler(c.req.raw);
	return response;
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, c) => ({
			session: c.get("session"),
			db: c.get("db"),
			env: c.env,
		}),
	}),
);

app.route("/api/counter", counterRouter);
app.route("/api/connection-count", connectionCounterRouter);

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw)); // Catch-All API route for static assets

export type AppType = typeof app;
export default app;

// Export Durable Objects
export { Counter, ConnectionCounter };
