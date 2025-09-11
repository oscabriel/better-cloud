import { getLocalD1Path } from "@/server/db/utils";
import { defineConfig } from "drizzle-kit";

const IS_DEV = process.env.DB_STAGE === "dev";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/server/db/schema",
	out: "./src/server/db/migrations",
	...(IS_DEV
		? {
				dbCredentials: {
					url: `file:${getLocalD1Path()}`,
				},
			}
		: {
				driver: "d1-http",
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
					databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
					token: process.env.CLOUDFLARE_API_TOKEN || "",
				},
			}),
});
