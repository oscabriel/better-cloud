/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FRONTEND_DEV_URL: string;
	readonly VITE_FRONTEND_PROD_URL: string;
	readonly VITE_GITHUB_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
