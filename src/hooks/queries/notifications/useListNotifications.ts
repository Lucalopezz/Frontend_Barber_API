import { useQuery } from "@tanstack/react-query";
import { getSessionSnapshot } from "@/auth/session";
import { useUser } from "@/hooks/useUser";
import type { NotificationList } from "@/types/notification.type";
import api from "@/utils/api";

export function useListNotifications(page: number) {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<NotificationList>({
    queryKey: ["notifications", sessionId, page],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<NotificationList>("/notifications", {
        params: { page, perPage: 15 }, signal,
      });
      return data;
    },
    enabled: authenticated && !!sessionId,
    staleTime: 0,
  });
}
