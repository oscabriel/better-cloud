import { drizzle } from "drizzle-orm/d1";
import type { MiddlewareHandler } from "hono";
import { auth } from "../lib/auth";
import type { AppBindings } from "../lib/types";

// Database & Auth instantiation middleware
const authMiddleware: MiddlewareHandler<AppBindings> = (c, next) => {
	const db = drizzle(c.env.DB);
	const authInstance = auth(db, c.env);
	c.set("db", db);
	c.set("auth", authInstance);
	return next();
};

export default authMiddleware;
