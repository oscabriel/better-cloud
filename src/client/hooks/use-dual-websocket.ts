import {
	type ConnectionCountMessage,
	connectionCounterAPI,
} from "@client/lib/api/connection-counter";
import {
	type CounterState,
	type CounterWebSocketMessage,
	counterAPI,
} from "@client/lib/api/counter";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDualWebSocketOptions {
	onCounterUpdate?: (state: CounterState) => void;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
}

export interface UseDualWebSocketReturn {
	isConnected: boolean;
	connectionState: "connecting" | "connected" | "disconnected" | "error";
	lastError: string | null;
	reconnectCount: number;
	connectionCount: number;
	connect: () => void;
	disconnect: () => void;
}

export function useDualWebSocket({
	onCounterUpdate,
	reconnectInterval = 5000,
	maxReconnectAttempts = 3,
}: UseDualWebSocketOptions = {}): UseDualWebSocketReturn {
	const [connectionState, setConnectionState] = useState<
		"connecting" | "connected" | "disconnected" | "error"
	>("disconnected");
	const [lastError, setLastError] = useState<string | null>(null);
	const [reconnectCount, setReconnectCount] = useState(0);
	const [connectionCount, setConnectionCount] = useState<number>(0);

	// Separate refs for both WebSocket connections
	const counterWsRef = useRef<WebSocket | null>(null);
	const connectionCounterWsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isManuallyDisconnected = useRef(false);
	const callbackRef = useRef(onCounterUpdate);

	// Update callback ref when it changes
	callbackRef.current = onCounterUpdate;

	const clearTimeouts = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}
	}, []);

	const startPingInterval = useCallback(() => {
		// Send ping every 50 seconds to keep hibernated connections alive
		pingIntervalRef.current = setInterval(() => {
			if (counterWsRef.current?.readyState === WebSocket.OPEN) {
				counterWsRef.current.send("ping");
			}
			if (connectionCounterWsRef.current?.readyState === WebSocket.OPEN) {
				connectionCounterWsRef.current.send("ping");
			}
		}, 50000);
	}, []);

	// Check if both connections are in the desired state
	const checkConnectionState = useCallback(() => {
		const counterState = counterWsRef.current?.readyState;
		const connectionCounterState = connectionCounterWsRef.current?.readyState;

		if (
			counterState === WebSocket.OPEN &&
			connectionCounterState === WebSocket.OPEN
		) {
			setConnectionState("connected");
		} else if (
			counterState === WebSocket.CONNECTING ||
			connectionCounterState === WebSocket.CONNECTING
		) {
			setConnectionState("connecting");
		} else if (
			counterState === WebSocket.CLOSED &&
			connectionCounterState === WebSocket.CLOSED
		) {
			setConnectionState("disconnected");
		}
	}, []);

	const connectCounterWebSocket = useCallback(() => {
		if (counterWsRef.current?.readyState === WebSocket.OPEN) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			try {
				const ws = counterAPI.createWebSocket();
				counterWsRef.current = ws;

				ws.onopen = () => {
					console.log("Counter WebSocket connected successfully");
					checkConnectionState();

					// Subscribe to counter updates
					const subscribeMessage = JSON.stringify({
						type: "subscribe",
						timestamp: Date.now(),
					});
					ws.send(subscribeMessage);
					resolve();
				};

				ws.onmessage = (event) => {
					// Handle pong response
					if (event.data === "pong") {
						return;
					}

					try {
						const parsed = JSON.parse(event.data) as CounterWebSocketMessage;

						// Handle counter update or initial state messages
						if (
							parsed.type === "counter-update" ||
							parsed.type === "counter-state"
						) {
							if (parsed.data && callbackRef.current) {
								callbackRef.current(parsed.data);
							}
						}
					} catch (error) {
						console.error("Failed to parse Counter WebSocket message:", error);
					}
				};

				ws.onclose = (event) => {
					console.log(`Counter WebSocket closed: code=${event.code}`);
					checkConnectionState();
				};

				ws.onerror = (error) => {
					console.error("Counter WebSocket error:", error);
					reject(error);
				};
			} catch (error) {
				reject(error);
			}
		});
	}, [checkConnectionState]);

	const connectConnectionCounterWebSocket = useCallback(() => {
		if (connectionCounterWsRef.current?.readyState === WebSocket.OPEN) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			try {
				const ws = connectionCounterAPI.createWebSocket();
				connectionCounterWsRef.current = ws;

				ws.onopen = () => {
					console.log("ConnectionCounter WebSocket connected successfully");
					checkConnectionState();

					// Subscribe to connection count updates
					const subscribeMessage = JSON.stringify({
						type: "subscribe",
						timestamp: Date.now(),
					});
					ws.send(subscribeMessage);
					resolve();
				};

				ws.onmessage = (event) => {
					// Handle pong response
					if (event.data === "pong") {
						return;
					}

					try {
						const parsed = JSON.parse(event.data) as ConnectionCountMessage;

						// Handle connection count updates from ConnectionCounter DO
						if (parsed.type === "connection-count") {
							setConnectionCount(parsed.count);
							return;
						}
					} catch (error) {
						console.error(
							"Failed to parse ConnectionCounter WebSocket message:",
							error,
						);
					}
				};

				ws.onclose = (event) => {
					console.log(`ConnectionCounter WebSocket closed: code=${event.code}`);
					checkConnectionState();
				};

				ws.onerror = (error) => {
					console.error("ConnectionCounter WebSocket error:", error);
					reject(error);
				};
			} catch (error) {
				reject(error);
			}
		});
	}, [checkConnectionState]);

	const connectBothWebSockets = useCallback(async () => {
		if (
			counterWsRef.current?.readyState === WebSocket.OPEN &&
			connectionCounterWsRef.current?.readyState === WebSocket.OPEN
		) {
			return;
		}

		clearTimeouts();
		isManuallyDisconnected.current = false;
		setConnectionState("connecting");
		setLastError(null);

		try {
			// Connect to both WebSockets concurrently
			await Promise.all([
				connectCounterWebSocket(),
				connectConnectionCounterWebSocket(),
			]);

			console.log("Both WebSockets connected successfully");
			setConnectionState("connected");
			setReconnectCount(0);
			setLastError(null);
			startPingInterval();
		} catch (error) {
			console.error("Failed to connect WebSockets:", error);
			setConnectionState("error");
			setLastError("Failed to establish WebSocket connections");

			// Clean up any partial connections
			if (counterWsRef.current) {
				counterWsRef.current.close();
				counterWsRef.current = null;
			}
			if (connectionCounterWsRef.current) {
				connectionCounterWsRef.current.close();
				connectionCounterWsRef.current = null;
			}

			// Attempt reconnect if not manually disconnected
			if (!isManuallyDisconnected.current) {
				setReconnectCount((prevCount) => {
					if (prevCount < maxReconnectAttempts) {
						console.log(
							`Scheduling reconnect attempt ${prevCount + 1}/${maxReconnectAttempts} in ${reconnectInterval}ms`,
						);
						reconnectTimeoutRef.current = setTimeout(() => {
							connectBothWebSockets();
						}, reconnectInterval);
						return prevCount + 1;
					}
					console.log("Max reconnect attempts reached");
					return prevCount;
				});
			}
		}
	}, [
		clearTimeouts,
		startPingInterval,
		connectCounterWebSocket,
		connectConnectionCounterWebSocket,
		reconnectInterval,
		maxReconnectAttempts,
	]);

	// Create stable connect function
	const connect = useCallback(() => {
		setReconnectCount(0);
		connectBothWebSockets();
	}, [connectBothWebSockets]);

	const disconnect = useCallback(() => {
		isManuallyDisconnected.current = true;
		clearTimeouts();

		// Send unsubscribe messages before closing connections
		if (counterWsRef.current?.readyState === WebSocket.OPEN) {
			try {
				counterWsRef.current.send(
					JSON.stringify({ type: "unsubscribe", timestamp: Date.now() }),
				);
			} catch (error) {
				console.error("Error sending unsubscribe to Counter WebSocket:", error);
			}
		}

		if (connectionCounterWsRef.current?.readyState === WebSocket.OPEN) {
			try {
				connectionCounterWsRef.current.send(
					JSON.stringify({ type: "unsubscribe", timestamp: Date.now() }),
				);
			} catch (error) {
				console.error(
					"Error sending unsubscribe to ConnectionCounter WebSocket:",
					error,
				);
			}
		}

		// Close both WebSocket connections
		if (counterWsRef.current) {
			counterWsRef.current.close();
			counterWsRef.current = null;
		}
		if (connectionCounterWsRef.current) {
			connectionCounterWsRef.current.close();
			connectionCounterWsRef.current = null;
		}

		setConnectionState("disconnected");
		setReconnectCount(0);
		setConnectionCount((prev) => Math.max(prev - 1, 0));
	}, [clearTimeouts]);

	useEffect(() => {
		return () => {
			disconnect();
		};
	}, [disconnect]);

	return {
		isConnected: connectionState === "connected",
		connectionState,
		lastError,
		reconnectCount,
		connectionCount,
		connect,
		disconnect,
	};
}
