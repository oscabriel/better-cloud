import { Separator } from "@/client/components/ui/separator";
import { GITHUB_REPO_URL, PERSONAL_SITE_URL } from "@/client/lib/constants";

export function Footer() {
	return (
		<div className="mt-12 pb-16">
			<Separator className="my-8" />
			<p className="text-muted-foreground text-sm">
				This {""}
				<a href={GITHUB_REPO_URL} className="underline">
					web app
				</a>{" "}
				is built with Vite/React, Hono, and tRPC, and is deployed to Cloudflare
				Workers via Alchemy. Check out my other projects at {""}
				<a href={PERSONAL_SITE_URL} className="underline">
					{PERSONAL_SITE_URL}
				</a>
				.
			</p>
		</div>
	);
}
