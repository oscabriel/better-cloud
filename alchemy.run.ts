import alchemy from "alchemy";
import {
	D1Database,
	DurableObjectNamespace,
	KVNamespace,
	Vite,
	Worker,
	WranglerJson,
} from "alchemy/cloudflare";

const stage = process.env.ALCHEMY_STAGE || "dev";

const app = await alchemy("better-cloud", {
	stage,
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

export const client = await Vite("client", {
	name: `${app.name}-client`,
	assets: "dist",
	adopt: true,
	bindings: {
		VITE_CLIENT_URL: process.env.VITE_CLIENT_URL!,
		VITE_SERVER_URL: process.env.VITE_SERVER_URL!,
	},
	domains: [
		{
			domainName: process.env.CUSTOM_WEB_DOMAIN!,
			zoneId: process.env.CLOUDFLARE_ZONE_ID!,
			adopt: true,
		},
	],
});

export const server = await Worker("server", {
	name: `${app.name}`,
	entrypoint: "src/server/index.ts",
	compatibility: "node",
	adopt: true,
	bindings: {
		DB: db,
		SESSION_KV: sessions,
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
			domainName: process.env.CUSTOM_API_DOMAIN!,
			zoneId: process.env.CLOUDFLARE_ZONE_ID!,
			adopt: true,
		},
	],
	dev: {
		port: 8787,
	},
});

if (stage === "prod") {
	await WranglerJson({
		worker: server,
		path: "wrangler.jsonc",
	});

	console.log("\nDeployed via Alchemy:");
	console.log(`  Client -> https://${process.env.CUSTOM_WEB_DOMAIN}`);
	console.log(`  Server -> https://${process.env.CUSTOM_API_DOMAIN}`);
}

await app.finalize();
