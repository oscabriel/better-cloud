// API Response Types for connection count messages
export interface ConnectionCountMessage {
	type: "connection-count";
	count: number;
	timestamp: number;
}

// API Service Class for the ConnectionCounter Durable Object
export class ConnectionCounterAPI {
	private baseUrl: string;

	constructor(baseUrl = "/connection-count") {
		this.baseUrl = baseUrl;
	}

	createWebSocket(): WebSocket {
		// Use VITE_SERVER_URL from environment to determine correct server URL
		const serverUrl =
			import.meta.env.VITE_SERVER_URL ||
			`${window.location.protocol}//${window.location.host}`;
		const url = new URL(serverUrl);
		const protocol = url.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${protocol}//${url.host}${this.baseUrl}/websocket`;
		const ws = new WebSocket(wsUrl);

		// Add connection timeout
		const connectionTimeout = setTimeout(() => {
			if (ws.readyState === WebSocket.CONNECTING) {
				ws.close();
			}
		}, 10000); // 10 second timeout

		ws.addEventListener("open", () => clearTimeout(connectionTimeout));

		ws.addEventListener("error", (error) => {
			console.error(
				"WebSocket connection error (ConnectionCounterAPI):",
				error,
			);
		});

		return ws;
	}
}

// Singleton instance
export const connectionCounterAPI = new ConnectionCounterAPI();
