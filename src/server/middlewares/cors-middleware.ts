import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import type { AppBindings } from "../lib/types";

// CORS middleware
const corsMiddleware: MiddlewareHandler<AppBindings> = (c, next) => {
	return cors({
		origin: c.env.TRUSTED_ORIGINS,
		maxAge: 86400,
		credentials: true,
	})(c, next);
};

export default corsMiddleware;
