import { type CounterState, counterAPI } from "@client/lib/api/counter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys
export const counterKeys = {
	all: ["counter"] as const,
	state: () => [...counterKeys.all, "state"] as const,
};

// Get counter state
export function useCounterQuery() {
	return useQuery({
		queryKey: counterKeys.state(),
		queryFn: () => counterAPI.getCounter(),
		staleTime: 1000 * 30, // 30 seconds
		refetchOnWindowFocus: true,
		retry: 3,
	});
}

// Increment counter
export function useIncrementCounter() {
	const queryClient = useQueryClient();

	return useMutation<
		CounterState,
		Error,
		number,
		{ previousState: CounterState | undefined }
	>({
		mutationFn: (amount = 1) => counterAPI.increment(amount),
		onMutate: async (amount = 1) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: counterKeys.state() });

			// Snapshot previous value
			const previousState = queryClient.getQueryData<CounterState>(
				counterKeys.state(),
			);

			// Optimistically update
			if (previousState) {
				queryClient.setQueryData<CounterState>(counterKeys.state(), {
					...previousState,
					value: previousState.value + amount,
					totalIncrements: previousState.totalIncrements + amount,
					lastUpdated: Date.now(),
				});
			}

			return { previousState };
		},
		onError: (error, _amount, context) => {
			// Rollback optimistic update
			if (context?.previousState) {
				queryClient.setQueryData(counterKeys.state(), context.previousState);
			}

			toast.error("Failed to increment counter", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
		onSuccess: (data) => {
			// Update with server response
			queryClient.setQueryData(counterKeys.state(), data);
			toast.success(`Counter incremented to ${data.value}`);
		},
	});
}

// Decrement counter
export function useDecrementCounter() {
	const queryClient = useQueryClient();

	return useMutation<
		CounterState,
		Error,
		number,
		{ previousState: CounterState | undefined }
	>({
		mutationFn: (amount = 1) => counterAPI.decrement(amount),
		onMutate: async (amount = 1) => {
			await queryClient.cancelQueries({ queryKey: counterKeys.state() });

			const previousState = queryClient.getQueryData<CounterState>(
				counterKeys.state(),
			);

			if (previousState) {
				queryClient.setQueryData<CounterState>(counterKeys.state(), {
					...previousState,
					value: previousState.value - amount,
					totalDecrements: previousState.totalDecrements + amount,
					lastUpdated: Date.now(),
				});
			}

			return { previousState };
		},
		onError: (error, _amount, context) => {
			if (context?.previousState) {
				queryClient.setQueryData(counterKeys.state(), context.previousState);
			}

			toast.error("Failed to decrement counter", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
		onSuccess: (data) => {
			queryClient.setQueryData(counterKeys.state(), data);
			toast.success(`Counter decremented to ${data.value}`);
		},
	});
}

// Combined hook for all counter operations
export function useCounter() {
	const query = useCounterQuery();
	const incrementMutation = useIncrementCounter();
	const decrementMutation = useDecrementCounter();

	return {
		// Data
		data: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,

		// Actions
		increment: incrementMutation.mutate,
		decrement: decrementMutation.mutate,

		// States
		isIncrementing: incrementMutation.isPending,
		isDecrementing: decrementMutation.isPending,
		isAnyActionPending:
			incrementMutation.isPending || decrementMutation.isPending,

		// Refetch
		refetch: query.refetch,
	};
}
