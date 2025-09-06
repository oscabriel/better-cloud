import alchemy from "alchemy";
import {
	Assets,
	D1Database,
	DurableObjectNamespace,
	KVNamespace,
	Worker,
	WranglerJson,
} from "alchemy/cloudflare";

const stage = process.env.ALCHEMY_STAGE || "dev";

const app = await alchemy("better-cloud", {
	stage,
	password: process.env.ALCHEMY_PASSWORD || "dev-password-123",
});

const db = await D1Database("database", {
	name: `${app.name}-db`,
	migrationsDir: "./src/server/db/migrations",
	adopt: true,
	readReplication: { mode: "auto" },
});

const sessions = await KVNamespace("sessions", {
	title: "user-sessions",
	adopt: true,
});

const counter = DurableObjectNamespace("counter", {
	className: "Counter",
	sqlite: true,
});

const connectionCounter = DurableObjectNamespace("connection-counter", {
	className: "ConnectionCounter",
	sqlite: false, // Connection counter doesn't need persistent storage
});

const assets = await Assets("static", {
	path: "./dist/client",
});

export const worker = await Worker("worker", {
	name: `${app.name}`,
	entrypoint: "src/server/index.ts",
	compatibility: "node",
	adopt: true,
	bindings: {
		DB: db,
		SESSION_KV: sessions,
		ASSETS: assets,
		COUNTER: counter,
		CONNECTION_COUNTER: connectionCounter,
		ALCHEMY_STAGE: stage,
		TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS!,
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET!),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
		GOOGLE_CLIENT_ID: alchemy.secret(process.env.GOOGLE_CLIENT_ID!),
		GOOGLE_CLIENT_SECRET: alchemy.secret(process.env.GOOGLE_CLIENT_SECRET!),
		GITHUB_CLIENT_ID: alchemy.secret(process.env.GITHUB_CLIENT_ID!),
		GITHUB_CLIENT_SECRET: alchemy.secret(process.env.GITHUB_CLIENT_SECRET!),
		RESEND_API_KEY: alchemy.secret(process.env.RESEND_API_KEY!),
	},
	domains: [
		{
			domainName: process.env.CUSTOM_DOMAIN!,
			zoneId: process.env.CLOUDFLARE_ZONE_ID!,
			adopt: true,
		},
	],
});

if (stage === "prod") {
	await WranglerJson({
		worker: worker,
		path: "wrangler.jsonc",
	});
}

await app.finalize();
