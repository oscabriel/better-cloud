import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../lib/types";

// Session injection middleware
const sessionMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
	const authInstance = c.get("auth");
	if (!authInstance) {
		throw new Error("Auth instance not found");
	}

	const session = await authInstance.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return next();
};

export default sessionMiddleware;
