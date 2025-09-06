import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Database, Globe, Info, Zap } from "lucide-react";
import { useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/client/components/ui/card";
import { Separator } from "@/client/components/ui/separator";
import { Skeleton } from "@/client/components/ui/skeleton";
import { useCounter } from "@/client/hooks/use-counter-query";
import { useDualWebSocket } from "@/client/hooks/use-dual-websocket";
import { ConnectionStatus } from "./-components/counter/connection-status";
import { CounterControls } from "./-components/counter/counter-controls";
import { CounterDisplay } from "./-components/counter/counter-display";

export const Route = createFileRoute("/_protectedLayout/counter")({
	component: CounterPage,
});

function CounterPage() {
	const counter = useCounter();

	// Dual WebSocket connection for real-time updates to both durable objects
	const dualWs = useDualWebSocket({
		onCounterUpdate: () => {
			counter.refetch();
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs to be this way
	useEffect(() => {
		dualWs.connect();
		return () => {
			dualWs.disconnect();
		};
	}, []);

	return (
		<div className="container mx-auto space-y-4 px-4 py-4">
			{/* Header */}
			<div className="space-y-2 text-center">
				<h1 className="font-bold text-4xl">Global Counter</h1>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					Powered by Cloudflare Durable Objects.
				</p>
			</div>

			{/* Connection Status */}
			<ConnectionStatus connection={dualWs} />

			{/* Main Counter Section */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Counter Display */}
				<Card className="gap-3 lg:col-span-1">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2 text-xl">
							<Zap className="h-5 w-5" />
							<span>Live Counter</span>
						</CardTitle>
						<CardDescription>
							This counter is synced and stored globally using SQLite-backed
							Durable Objects.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{counter.isLoading ? (
							<div className="space-y-4">
								<Skeleton className="h-24 w-full" />
								<div className="grid grid-cols-3 gap-4">
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
								</div>
							</div>
						) : counter.isError ? (
							<div className="py-8 text-center">
								<AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-500" />
								<p className="font-medium text-red-600">
									Failed to load counter
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{counter.error instanceof Error
										? counter.error.message
										: "Unknown error"}
								</p>
							</div>
						) : counter.data ? (
							<CounterDisplay state={counter.data} />
						) : null}
					</CardContent>
				</Card>

				{/* Counter Controls */}
				<div className="w-full lg:col-span-1">
					<CounterControls
						onIncrement={counter.increment}
						onDecrement={counter.decrement}
						isIncrementing={counter.isIncrementing}
						isDecrementing={counter.isDecrementing}
						disabled={counter.isLoading || counter.isError}
						className="w-full"
					/>
				</div>
			</div>

			<Separator />

			{/* Information Section */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card className="gap-3">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2 text-xl">
							<Globe className="h-4 w-4" />
							<span>Global Consistency</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						<p>
							The counter value is globally consistent across all users and edge
							locations. Durable Objects ensure strong consistency guarantees.
						</p>
					</CardContent>
				</Card>

				<Card className="gap-3">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2 text-xl">
							<Database className="h-4 w-4" />
							<span>Persistent State</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						<p>
							Counter state persists across Worker restarts and Durable Object
							hibernation using SQLite-backed storage for reliability.
						</p>
					</CardContent>
				</Card>

				<Card className="gap-3">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2 text-xl">
							<Zap className="h-4 w-4" />
							<span>Real-time Updates</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						<p>
							WebSocket connections with hibernation API provide cost-effective
							real-time synchronization without continuous memory usage.
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Technical Details */}
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="flex items-center space-x-2 text-xl">
						<Info className="h-5 w-5" />
						<span>How It Works</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-muted-foreground text-sm">
					<div className="grid gap-4 lg:grid-cols-2">
						{/* Wide diagram for large screens */}
						<div className="hidden text-xs lg:block">
							<pre className="whitespace-pre text-slate-700 leading-tight dark:text-slate-300">
								{`                     SQLite-Backed Durable Object Data Flow

┌───────────────┐ HTTP/WebSocket ┌─────────────────┐ Requests ┌────────────────┐
│    Clients    │ ──────────────▶│  Cloudflare     │ ────────▶│   Durable      │
│               │◀────────────── │    Worker       │◀──────── │    Object      │
│ • React UI    │   JSON/Events  │                 │          │                │
│ • WebSocket   │                │ • Route Handler │          │ • In-Memory    │
│ • Real-time   │                │ • Validation    │          │ • WebSocket    │
└───────────────┘                └─────────────────┘          │   Manager      │
                                                              └────────────────┘
                                                                      │
                                                              ┌────────────────┐
                                                              │  SQLite DB     │
                                                              │ Transactional  │
                                                              │  Persistent    │
                                                              └────────────────┘

                               Hibernation Lifecycle

┌────────────────┐  idle 30s  ┌─────────────────┐   message  ┌─────────────────┐
│     ACTIVE     │ ──────────▶│   HIBERNATING   │ ──────────▶│   WAKE & LOAD   │
│                │            │                 │            │                 │
│ • Memory cache │            │ • Evicted from  │            │ • Constructor   │
│ • Fast access  │            │   memory        │            │ • SQLite load   │
│ • WebSockets   │◀────────── │ • Zero cost     │            │ • State restore │
└────────────────┘  continue  └─────────────────┘            └─────────────────┘`}
							</pre>
						</div>

						{/* Compact diagram for small screens */}
						<div className="p-3 text-sm lg:hidden">
							<pre className="overflow-x-auto whitespace-pre text-slate-700 leading-tight dark:text-slate-300">
								{`SQLite-Backed Durable Object

┌─────────┐  HTTP/WS   ┌───────────┐
│ Clients │ ──────────▶│  Worker   │
│         │◀────────── │           │
└─────────┘            └───────────┘
                            │
                       ┌───────────┐
                       │  Durable  │
                       │  Object   │
                       └───────────┘
                            │
                       ┌───────────┐
                       │  SQLite   │
                       │ Database  │
                       └───────────┘

    Hibernation Lifecycle

┌───────────┐  idle   ┌────────────┐
│  ACTIVE   │ ───────▶│  SLEEPING  │
│   Memory  │         │   Zero $   │
│   Cache   │◀─────── │   Evicted  │
└───────────┘ wake    └────────────┘`}
							</pre>
						</div>
						<div>
							<h4 className="mb-2 text-foreground text-lg">Key Benefits</h4>
							<div className="space-y-2">
								<div className="border-muted border-l-2 pl-3">
									<p className="mb-1 font-bold text-foreground text-sm">
										Cost Efficiency:
									</p>
									<p className="text-muted-foreground text-sm">
										- DO Hibernation Model eliminates memory charges during idle
										periods, only paying for active compute time.
									</p>
								</div>
								<div className="border-muted border-l-2 pl-3">
									<p className="mb-1 font-bold text-foreground text-sm">
										Zero Data Loss:
									</p>
									<p className="text-muted-foreground text-sm">
										- SQLite provides ACID transactional guarantees with WAL
										mode ensuring durability across hibernation.
									</p>
								</div>
								<div className="border-muted border-l-2 pl-3">
									<p className="mb-1 font-bold text-foreground text-sm">
										Instant Wake:
									</p>
									<p className="text-muted-foreground text-sm">
										- Fast restoration from hibernation with transparent state
										loading from SQLite.
									</p>
								</div>
								<div className="border-muted border-l-2 pl-3">
									<p className="mb-1 font-bold text-foreground text-sm">
										Strong Consistency:
									</p>
									<p className="text-muted-foreground text-sm">
										- Single Durable Object processes all operations
										sequentially, eliminating race conditions.
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
