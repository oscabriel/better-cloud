import { z } from "zod";

// API Response Types
export const CounterStateSchema = z.object({
	value: z.number(),
	lastUpdated: z.number(),
	totalIncrements: z.number(),
	totalDecrements: z.number(),
	lastUpdater: z.string().nullable().optional(),
});

export type CounterState = z.infer<typeof CounterStateSchema>;

export interface CounterOperation {
	amount?: number;
}

// WebSocket Message Types
export interface CounterWebSocketMessage {
	type: "subscribe" | "counter-update" | "counter-state";
	data?: CounterState;
	timestamp: number;
}

// API Service Class
export class CounterAPI {
	private baseUrl: string;

	constructor(baseUrl = "/counter") {
		this.baseUrl = baseUrl;
	}

	async getCounter(): Promise<CounterState> {
		const serverUrl = import.meta.env.VITE_SERVER_URL || "";
		const url = serverUrl ? `${serverUrl}${this.baseUrl}` : this.baseUrl;
		const response = await fetch(url, {
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(`Failed to get counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
	}

	async increment(amount = 1): Promise<CounterState> {
		const serverUrl = import.meta.env.VITE_SERVER_URL || "";
		const url = serverUrl
			? `${serverUrl}${this.baseUrl}/increment`
			: `${this.baseUrl}/increment`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ amount }),
		});

		if (!response.ok) {
			throw new Error(`Failed to increment counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
	}

	async decrement(amount = 1): Promise<CounterState> {
		const serverUrl = import.meta.env.VITE_SERVER_URL || "";
		const url = serverUrl
			? `${serverUrl}${this.baseUrl}/decrement`
			: `${this.baseUrl}/decrement`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ amount }),
		});

		if (!response.ok) {
			throw new Error(`Failed to decrement counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
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

		ws.addEventListener("open", () => {
			clearTimeout(connectionTimeout);
		});

		ws.addEventListener("error", (error) => {
			clearTimeout(connectionTimeout);
			console.error("WebSocket connection error:", error);
		});

		return ws;
	}
}

// Singleton instance
export const counterAPI = new CounterAPI();
