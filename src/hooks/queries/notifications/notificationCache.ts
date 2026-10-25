import type { Notification, NotificationList } from "@/types/notification.type";

export interface NotificationIdentity { sessionId: string; generation: string }

export function isNotificationIdentityCurrent(expected: NotificationIdentity, current?: NotificationIdentity): boolean {
  // Generation guards against a stale mutation touching a later identity's cache.
  return current?.sessionId === expected.sessionId && current.generation === expected.generation;
}

export function mergeReadNotification(list: NotificationList | undefined, notification: Notification): NotificationList | undefined {
  return list && { ...list, data: list.data.map((item) => item.id === notification.id ? notification : item) };
}
