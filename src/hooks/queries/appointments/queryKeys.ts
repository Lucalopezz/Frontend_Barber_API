import type { ListAppointmentsParams } from "./useListAppointments";

export const appointmentKeys = {
  root: ["appointments"] as const,
  list: (sessionId: string | undefined, params: ListAppointmentsParams) =>
    ["appointments", sessionId, params] as const,
};

export const availabilityKeys = {
  root: ["availability"] as const,
  own: (sessionId: string | undefined) => ["availability", sessionId, "me"] as const,
  shop: (sessionId: string | undefined, shopId: string, serviceId: string, date: string) =>
    ["availability", sessionId, "shop", shopId, { serviceId, date }] as const,
};
