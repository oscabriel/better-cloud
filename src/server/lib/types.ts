// Counter state interface matching the Durable Object structure
export interface CounterState {
	value: number;
	lastUpdated: number;
	totalIncrements: number;
	totalDecrements: number;
	lastUpdater: string | null;
}
