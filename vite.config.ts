import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(() => ({
	plugins: [
		tanstackRouter({
			routesDirectory: "./src/client/routes",
			generatedRouteTree: "./src/client/routeTree.gen.ts",
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@client": path.resolve(__dirname, "./src/client/"),
			"@server": path.resolve(__dirname, "./src/server/"),
		},
	},
	build: {
		// Only build client-side code with Vite
		rollupOptions: {
			input: "./index.html", // HTML entry point for client
		},
		outDir: "dist/client", // Separate client build directory
	},
	envDir: "./", // Look for .env files in root directory
	envPrefix: ["VITE_"], // Only expose VITE_ prefixed variables to client
	root: ".", // Ensure root is project directory
}));
