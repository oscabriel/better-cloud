import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";

/**
 * Initialize a Drizzle D1 database instance from the Cloudflare D1 binding.
 */
export function initDb(env: Env): DrizzleD1Database {
	return drizzle(env.DB);
}

/**
 * Alias for our Drizzle D1 database instance type.
 */
export type DBInstance = DrizzleD1Database;
