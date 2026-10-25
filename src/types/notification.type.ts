export interface Notification {
  id: string;
  appointmentId: string;
  type: "appointment_created" | "appointment_updated" | "appointment_cancelled" | "appointment_reminder";
  serviceName: string;
  barberShopName: string;
  startsAt: string;
  previousStartsAt?: string | null;
  previousServiceName?: string | null;
  timezone: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationList {
  data: Notification[];
  meta: { currentPage: number; perPage: number; lastPage: number; total: number };
}
