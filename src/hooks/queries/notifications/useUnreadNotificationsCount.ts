import { useQuery } from "@tanstack/react-query";
import { getSessionSnapshot } from "@/auth/session";
import { useUser } from "@/hooks/useUser";
import api from "@/utils/api";
import { notificationKeys, notificationPolling } from "./queryKeys";

export function useUnreadNotificationsCount() {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<number>({
    queryKey: notificationKeys.unread(sessionId ?? ""),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<{ data: { count: number } }>("/notifications/unread-count", { signal });
      const count = data?.data?.count;
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("Contagem de notificações indisponível.");
      return count;
    },
    enabled: authenticated && !!sessionId,
    staleTime: 0,
    retry: false,
    ...notificationPolling,
  });
}
