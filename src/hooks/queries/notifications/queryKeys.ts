export const notificationKeys = {
  // Account-scoped keys keep one user's cache separate from another's.
  lists: (sessionId: string) => ["notifications", sessionId, "list"] as const,
  list: (sessionId: string, page: number) => ["notifications", sessionId, "list", page] as const,
  unread: (sessionId: string) => ["notifications", sessionId, "unread-count"] as const,
};

export const notificationPolling = {
  refetchInterval: 30_000,
  // Poll again on foreground instead of spending requests in the background.
  refetchIntervalInBackground: false,
} as const;
