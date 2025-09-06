import { Button } from "@client/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import { Slider } from "@client/components/ui/slider";
import { cn } from "@client/lib/utils";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface CounterControlsProps {
	onIncrement: (amount: number) => void;
	onDecrement: (amount: number) => void;
	isIncrementing?: boolean;
	isDecrementing?: boolean;
	disabled?: boolean;
	className?: string;
}

export function CounterControls({
	onIncrement,
	onDecrement,
	isIncrementing = false,
	isDecrementing = false,
	disabled = false,
	className,
}: CounterControlsProps) {
	const [customAmount, setCustomAmount] = useState(5);
	const [lastClickedButton, setLastClickedButton] = useState<string | null>(
		null,
	);

	const handleCustomAmountChange = (value: number[]) => {
		setCustomAmount(value[0]);
	};

	const handleButtonClick = (action: () => void, buttonId: string) => {
		setLastClickedButton(buttonId);
		action();
		// Clear the feedback after a short delay
		setTimeout(() => setLastClickedButton(null), 200);
	};

	const isAnyActionPending = isIncrementing || isDecrementing;

	const getButtonVariant = (buttonId: string) => {
		if (lastClickedButton === buttonId) {
			return "default";
		}
		return "outline";
	};

	return (
		<Card className={cn("w-full gap-3", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-xl">Counter Controls</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Quick Actions */}
				<div className="space-y-3">
					<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
						Quick Actions
					</h3>

					<div className="grid grid-cols-2 gap-3">
						<Button
							variant={getButtonVariant("dec-1")}
							size="lg"
							onClick={() => handleButtonClick(() => onDecrement(1), "dec-1")}
							disabled={disabled || isAnyActionPending}
							className="w-full font-semibold text-base"
						>
							{isDecrementing ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Minus className="h-5 w-5" />
							)}
							<span className="ml-2 text-lg">1</span>
						</Button>

						<Button
							variant={getButtonVariant("inc-1")}
							size="lg"
							onClick={() => handleButtonClick(() => onIncrement(1), "inc-1")}
							disabled={disabled || isAnyActionPending}
							className="w-full font-semibold text-base"
						>
							{isIncrementing ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Plus className="h-5 w-5" />
							)}
							<span className="ml-2 text-lg">1</span>
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<Button
							variant={getButtonVariant("dec-10")}
							onClick={() => handleButtonClick(() => onDecrement(10), "dec-10")}
							disabled={disabled || isAnyActionPending}
							className="w-full font-semibold text-base"
						>
							<Minus className="h-4 w-4" />
							<span className="ml-2 text-lg">10</span>
						</Button>

						<Button
							variant={getButtonVariant("inc-10")}
							onClick={() => handleButtonClick(() => onIncrement(10), "inc-10")}
							disabled={disabled || isAnyActionPending}
							className="w-full font-semibold text-base"
						>
							<Plus className="h-4 w-4" />
							<span className="ml-2 text-lg">10</span>
						</Button>
					</div>
				</div>

				{/* Custom Amount */}
				<div className="space-y-3">
					<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
						Custom Amount
					</h3>

					<div className="space-y-4">
						<div className="space-y-2">
							<div className="text-center">
								<span className="font-semibold text-2xl">{customAmount}</span>
							</div>
							<Slider
								value={[customAmount]}
								onValueChange={handleCustomAmountChange}
								min={1}
								max={100}
								step={1}
								disabled={disabled || isAnyActionPending}
								className="w-full"
							/>
							<div className="flex justify-between text-muted-foreground text-xs">
								<span>1</span>
								<span>100</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<Button
								variant={getButtonVariant(`dec-${customAmount}`)}
								onClick={() =>
									handleButtonClick(
										() => onDecrement(customAmount),
										`dec-${customAmount}`,
									)
								}
								disabled={disabled || isAnyActionPending}
								className="w-full font-semibold text-xl"
							>
								<Minus className="h-4 w-4" />
								<span className="ml-1 text-lg">{customAmount}</span>
							</Button>

							<Button
								variant={getButtonVariant(`inc-${customAmount}`)}
								onClick={() =>
									handleButtonClick(
										() => onIncrement(customAmount),
										`inc-${customAmount}`,
									)
								}
								disabled={disabled || isAnyActionPending}
								className="w-full font-semibold text-xl"
							>
								<Plus className="h-4 w-4" />
								<span className="ml-1 text-lg">{customAmount}</span>
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
