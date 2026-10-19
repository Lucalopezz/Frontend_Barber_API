export const queryPolicies = {
  shopAndService: { staleTime: 5 * 60_000 },
  appointments: { staleTime: 30_000, refetchInterval: 30_000 },
  availability: { staleTime: 0, refetchInterval: 30_000 },
} as const;
