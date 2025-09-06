import { memo } from "react";
import type { CounterState } from "@/client/lib/api/counter";
import { cn } from "@/client/lib/utils";

interface CounterDisplayProps {
	state: CounterState;
	className?: string;
	showStats?: boolean;
}

export const CounterDisplay = memo(function CounterDisplay({
	state,
	className,
	showStats = true,
}: CounterDisplayProps) {
	const formatNumber = (num: number) => {
		return new Intl.NumberFormat().format(num);
	};

	const formatDate = (timestamp: number) => {
		return new Intl.DateTimeFormat("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}).format(new Date(timestamp));
	};

	const getLastUpdaterDisplay = (lastUpdater: string | null | undefined) => {
		if (!lastUpdater) {
			return "Someone";
		}
		return lastUpdater;
	};

	return (
		<div className={cn("space-y-4 text-center", className)}>
			{/* Main Counter Value */}
			<div className="space-y-2">
				<h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Current Value
				</h2>
				<div className="font-bold text-6xl md:text-8xl">
					{formatNumber(state.value)}
				</div>
			</div>

			{/* Statistics */}
			{showStats && (
				<div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
					<div className="space-y-1 rounded-lg bg-muted/50 p-3">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Total Increments
						</div>
						<div className="font-semibold text-2xl text-green-600">
							+{formatNumber(state.totalIncrements)}
						</div>
					</div>

					<div className="space-y-1 rounded-lg bg-muted/50 p-3">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Total Decrements
						</div>
						<div className="font-semibold text-2xl text-red-600">
							-{formatNumber(state.totalDecrements)}
						</div>
					</div>

					<div className="space-y-1 rounded-lg bg-muted/50 p-3 sm:col-span-2 md:col-span-1">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Last Updated
						</div>
						<div className="font-semibold text-lg">
							{state.lastUpdated ? (
								<>
									{formatDate(state.lastUpdated)}
									<div className="mt-1 text-muted-foreground text-sm">
										by {getLastUpdaterDisplay(state.lastUpdater)}
									</div>
								</>
							) : (
								"Never"
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
});
