import { publicProcedure, router } from "@/server/lib/trpc";
import { guestbookRouter } from "./guestbook";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	helloFrom: publicProcedure.query(() => {
		return "CF+Hono+tRPC";
	}),
	guestbook: guestbookRouter,
	user: userRouter,
});
export type AppRouter = typeof appRouter;
