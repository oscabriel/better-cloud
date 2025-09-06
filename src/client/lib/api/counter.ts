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
		const response = await fetch(this.baseUrl);

		if (!response.ok) {
			throw new Error(`Failed to get counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
	}

	async increment(amount = 1): Promise<CounterState> {
		const response = await fetch(`${this.baseUrl}/increment`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ amount }),
		});

		if (!response.ok) {
			throw new Error(`Failed to increment counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
	}

	async decrement(amount = 1): Promise<CounterState> {
		const response = await fetch(`${this.baseUrl}/decrement`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ amount }),
		});

		if (!response.ok) {
			throw new Error(`Failed to decrement counter: ${response.statusText}`);
		}

		const data = await response.json();
		return CounterStateSchema.parse(data);
	}

	createWebSocket(): WebSocket {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${protocol}//${window.location.host}${this.baseUrl}/websocket`;
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
