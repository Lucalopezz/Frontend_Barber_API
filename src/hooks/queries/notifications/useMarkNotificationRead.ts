import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionSnapshot, onIdentityChange } from "@/auth/session";
import type { Notification, NotificationList } from "@/types/notification.type";
import api from "@/utils/api";
import { notificationKeys } from "./queryKeys";
import { isNotificationIdentityCurrent, mergeReadNotification } from "./notificationCache";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const controllers = useRef(new Set<AbortController>());
  const sessionId = getSessionSnapshot()?.sessionId;
  useEffect(() => {
    const active = controllers.current;
    // Abort on identity changes; the success guard also covers a response that wins this race.
    const abort = () => { active.forEach((controller) => controller.abort()); active.clear(); };
    const unsubscribe = onIdentityChange(abort);
    return () => { unsubscribe(); abort(); };
  }, []);

  return useMutation({
    mutationFn: async (id: string) => {
      const identity = getSessionSnapshot();
      if (!identity || identity.sessionId !== sessionId) throw new Error("Sua sessão mudou. Abra as notificações novamente.");
      const controller = new AbortController();
      controllers.current.add(controller);
      try {
        const { data } = await api.patch<{ data: Notification }>(`/notifications/${id}/read`, undefined, { signal: controller.signal });
        return { notification: data.data, identity };
      } finally { controllers.current.delete(controller); }
    },
    retry: false,
    onSuccess: async ({ notification, identity }) => {
      // A completed request may belong to an identity that has since logged out.
      // Never recreate that session's cache or invalidate the new account's data.
      if (!isNotificationIdentityCurrent(identity, getSessionSnapshot())) return;
      queryClient.setQueriesData<NotificationList>({ queryKey: notificationKeys.lists(identity.sessionId) }, (list) => mergeReadNotification(list, notification));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread(identity.sessionId) }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists(identity.sessionId) }),
      ]);
    },
  });
}
