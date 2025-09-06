import { env } from "cloudflare:workers";
import type { Context as HonoContext } from "hono";
import { db } from "@/server/db";
import { auth } from "./auth";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	try {
		const session = await auth.api.getSession({
			headers: context.req.raw.headers,
		});
		return {
			session,
			db,
			env,
			headers: context.req.raw.headers,
		};
	} catch (error) {
		console.error("Error creating context:", error);
		return {
			session: null,
			db,
			env,
			headers: context.req.raw.headers,
		};
	}
}

export type Context = Awaited<ReturnType<typeof createContext>>;
