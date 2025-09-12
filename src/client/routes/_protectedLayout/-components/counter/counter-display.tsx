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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2 rounded-lg bg-muted/50 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Total Changes
						</div>
						<div className="break-words text-center font-semibold text-2xl sm:text-xl md:text-2xl lg:text-3xl">
							<span className="whitespace-nowrap text-green-600">
								+{formatNumber(state.totalIncrements)}
							</span>
							<wbr />
							<span className="mx-1 text-muted-foreground sm:mx-2">/</span>
							<wbr />
							<span className="whitespace-nowrap text-red-600">
								-{formatNumber(state.totalDecrements)}
							</span>
						</div>
					</div>

					<div className="space-y-2 rounded-lg bg-muted/50 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Last Updated
						</div>
						<div className="space-y-1">
							{state.lastUpdated ? (
								<>
									<div className="font-semibold text-xl sm:text-lg">
										{formatDate(state.lastUpdated)}
									</div>
									<div className="text-base text-muted-foreground sm:text-sm">
										by {getLastUpdaterDisplay(state.lastUpdater)}
									</div>
								</>
							) : (
								<div className="font-semibold text-muted-foreground text-xl sm:text-lg">
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
