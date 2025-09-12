import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, openAPI } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/server/db";
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from "@/server/lib/constants";
import * as schema from "../db/schema/auth";
import { verificationCodeEmail } from "./email-templates";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema,
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	basePath: "/auth",
	trustedOrigins: env.TRUSTED_ORIGINS?.split(",") || [],
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	secondaryStorage: {
		get: async (key) => {
			const value = await env.SESSION_KV.get(key);
			return value;
		},
		set: async (key, value, ttl) => {
			if (ttl) {
				await env.SESSION_KV.put(key, value, { expirationTtl: ttl });
			} else {
				await env.SESSION_KV.put(key, value);
			}
		},
		delete: async (key) => {
			await env.SESSION_KV.delete(key);
		},
	},
	plugins: [
		openAPI(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (env.ALCHEMY_STAGE === "dev") {
					console.log(`Sending verification code to ${email}: ${otp}`);
					return;
				}
				if (type === "sign-in") {
					const resend = new Resend(env.RESEND_API_KEY);
					await resend.emails.send({
						from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
						to: email,
						subject: "Your Verification Code",
						html: verificationCodeEmail(otp),
					});
				}
			},
		}),
	],
	rateLimit: {
		storage: "secondary-storage",
	},
	advanced: {
		crossSubDomainCookies: {
			enabled: env.ALCHEMY_STAGE !== "dev",
			domain: env.ALCHEMY_STAGE === "dev" ? undefined : "better-cloud.dev",
		},
		defaultCookieAttributes: {
			sameSite: "lax",
			secure: env.ALCHEMY_STAGE !== "dev",
			httpOnly: true,
		},
	},
});
