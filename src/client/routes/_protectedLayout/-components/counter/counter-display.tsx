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
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-2 rounded-lg bg-muted/50 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Total Increments
						</div>
						<div className="font-semibold text-green-600 text-xl">
							+{formatNumber(state.totalIncrements)}
						</div>
					</div>

					<div className="space-y-2 rounded-lg bg-muted/50 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Total Decrements
						</div>
						<div className="font-semibold text-red-600 text-xl">
							-{formatNumber(state.totalDecrements)}
						</div>
					</div>

					<div className="space-y-2 rounded-lg bg-muted/50 p-4 sm:col-span-2 lg:col-span-1">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Last Updated
						</div>
						<div className="space-y-1">
							{state.lastUpdated ? (
								<>
									<div className="font-semibold text-sm">
										{formatDate(state.lastUpdated)}
									</div>
									<div className="text-muted-foreground text-xs">
										by {getLastUpdaterDisplay(state.lastUpdater)}
									</div>
								</>
							) : (
								<div className="font-semibold text-muted-foreground text-sm">
									Never
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
});
