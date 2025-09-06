import { desc } from "drizzle-orm";
import { z } from "zod";
import { guestbook_message } from "@/server/db/schema/guestbook";
import { publicProcedure, router } from "@/server/lib/trpc";

export const guestbookRouter = router({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select()
			.from(guestbook_message)
			.orderBy(desc(guestbook_message.createdAt));
	}),
	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				message: z.string().min(1),
				country: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db
				.insert(guestbook_message)
				.values({
					name: input.name,
					message: input.message,
					country: input.country || null,
				})
				.returning()
				.get();
		}),
});
