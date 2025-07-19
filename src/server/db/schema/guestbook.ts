import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guestbook_message = sqliteTable(
	"guestbook_message",
	{
		id: integer().primaryKey(),
		name: text().notNull(),
		message: text().notNull(),
		country: text(),
		createdAt: text("created_at", { mode: "text" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [index("idx_guestbook_created_at").on(table.createdAt)],
);

export type GuestBookMessage = InferSelectModel<typeof guestbook_message>;
