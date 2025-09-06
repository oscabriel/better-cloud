import { AlertTriangle, Loader2, Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/client/components/ui/card";
import type { UseDualWebSocketReturn } from "@/client/hooks/use-dual-websocket";
import { cn } from "@/client/lib/utils";

interface ConnectionStatusProps {
	connection: UseDualWebSocketReturn;
	className?: string;
}

export function ConnectionStatus({
	connection,
	className,
}: ConnectionStatusProps) {
	const {
		isConnected,
		connectionState,
		connectionCount,
		lastError,
		reconnectCount,
		connect,
		disconnect,
	} = connection;

	const getStatusIcon = () => {
		switch (connectionState) {
			case "connecting":
				return <Loader2 className="h-5 w-5 animate-spin" />;
			case "connected":
				return <Wifi className="h-5 w-5" />;
			case "error":
				return <AlertTriangle className="h-5 w-5" />;
			default:
				return <WifiOff className="h-5 w-5" />;
		}
	};

	const getStatusColor = () => {
		switch (connectionState) {
			case "connected":
				return "text-green-600";
			case "connecting":
				return "text-yellow-600";
			case "error":
				return "text-red-600";
			default:
				return "text-muted-foreground";
		}
	};

	const getStatusText = () => {
		switch (connectionState) {
			case "connecting":
				return reconnectCount > 0
					? `Reconnecting... (attempt ${reconnectCount})`
					: "Connecting...";
			case "connected":
				return "Realtime updates active";
			case "error":
				return `Connection error${lastError ? `: ${lastError}` : ""}`;
			default:
				return "Connect for real-time updates";
		}
	};

	const getBadgeVariant = () => {
		switch (connectionState) {
			case "connected":
				return "default";
			case "connecting":
				return "secondary";
			case "error":
				return "destructive";
			default:
				return "destructive";
		}
	};

	return (
		<Card className={cn("w-full gap-2", className)}>
			<CardHeader className="pb-1">
				<CardTitle className="flex items-center justify-between text-lg">
					<div className="flex items-center space-x-2">
						<div
							className={cn("flex items-center space-x-2", getStatusColor())}
						>
							{getStatusIcon()}
							<span className="font-semibold text-xl">Status</span>
						</div>
						<Badge variant={getBadgeVariant()} className="text-sm">
							{connectionState}
						</Badge>
					</div>
					<div className="flex items-center space-x-2">
						<Users className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium text-lg">
							{connectionCount} active
						</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<p className="text-base text-muted-foreground">{getStatusText()}</p>

					<div className="flex space-x-2">
						{connectionState === "connecting" && (
							<Button variant="default" size="sm" disabled>
								<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								Connecting...
							</Button>
						)}
						{!isConnected && connectionState !== "connecting" && (
							<Button variant="default" size="sm" onClick={connect}>
								Connect
							</Button>
						)}

						{isConnected && (
							<Button variant="outline" size="sm" onClick={disconnect}>
								Disconnect
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
