import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/client/components/ui/button";
import { Card, CardContent } from "@/client/components/ui/card";
import { trpc } from "@/client/lib/trpc-client";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

const title = `

   █████████  ███████████             ███████████    █████████  
  ███░░░░░███░░███░░░░░░█     ███    ░░███░░░░░███  ███░░░░░███ 
 ███     ░░░  ░███   █ ░     ░███     ░███    ░███ ░███    ░███ 
░███          ░███████    ███████████ ░██████████  ░███████████ 
░███          ░███░░░█   ░░░░░███░░░  ░███░░░░░███ ░███░░░░░███ 
░░███     ███ ░███  ░        ░███     ░███    ░███ ░███    ░███ 
 ░░█████████  █████          ░░░      ███████████  █████   █████
  ░░░░░░░░░  ░░░░░                   ░░░░░░░░░░░  ░░░░░   ░░░░░ 

`;

function RouteComponent() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const helloFrom = useQuery({
		...trpc.helloFrom.queryOptions(),
		enabled: false,
	});

	return (
		<div className="container mx-auto w-full min-w-0 max-w-[90vw] px-3 py-3 sm:max-w-2xl sm:px-4 md:max-w-3xl">
			<pre className="mx-auto overflow-x-auto text-center font-mono text-[0.5rem] sm:text-xs md:text-sm">
				{title}
			</pre>
			<div className="grid gap-4 sm:gap-6">
				<Card className="bg-background p-3 sm:p-4">
					<CardContent className="p-0">
						<div className="flex items-center justify-center gap-6">
							<div>
								<h2 className="mb-2 text-left font-medium">API Status</h2>
								<Button
									variant="outline"
									className="w-full min-w-0 sm:w-auto"
									onClick={() => {
										healthCheck.refetch();
									}}
								>
									<div
										className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
									/>
									<span className="text-xs sm:text-sm">
										{healthCheck.isLoading
											? "Checking..."
											: healthCheck.data
												? "Connected"
												: "Disconnected"}
									</span>
								</Button>
							</div>

							<div>
								<h2 className="mb-2 text-center font-medium sm:text-left">
									Hello From:
								</h2>
								<Button
									variant="outline"
									className="w-full min-w-0 sm:w-auto"
									onClick={() => {
										helloFrom.refetch();
									}}
								>
									<span className="truncate text-xs sm:text-sm">
										{helloFrom.data ?? "Click to Check"}
									</span>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<section>
					<h2 className="mb-2 font-medium text-2xl sm:mb-3">Core Features</h2>
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
						<FeatureItem
							title="Modern Frontend"
							description="Easy builds with Vite + React"
						/>
						<FeatureItem
							title="Edge Computing"
							description="CF Workers for global edge deployment"
						/>
						<FeatureItem
							title="Type-Safe API"
							description="End-to-end type safety with Hono + tRPC"
						/>
						<FeatureItem
							title="CF-Native Database"
							description="D1 + Drizzle for easy db transactions"
						/>
						<FeatureItem
							title="Tanstack Ecosystem"
							description="Router + Query + Form for seamless DX"
						/>
						<FeatureItem
							title="Fast Tooling"
							description="Bun + Biome for speedy development"
						/>
					</ul>
				</section>
			</div>
		</div>
	);
}

function FeatureItem({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<li className="border-primary border-l-2 py-1 pl-2 sm:pl-3">
			<h3 className="font-medium text-base sm:text-base">{title}</h3>
			<p className="text-muted-foreground text-sm sm:text-sm">{description}</p>
		</li>
	);
}
