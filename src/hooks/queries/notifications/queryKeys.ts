export const notificationKeys = {
  lists: (sessionId: string) => ["notifications", sessionId, "list"] as const,
  list: (sessionId: string, page: number) => ["notifications", sessionId, "list", page] as const,
  unread: (sessionId: string) => ["notifications", sessionId, "unread-count"] as const,
};

export const notificationPolling = {
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
} as const;
