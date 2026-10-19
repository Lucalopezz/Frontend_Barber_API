import { useUser } from "@/hooks/useUser";
import api from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export interface Availability {
  timezone: string;
  slots: { startsAt: string; endsAt: string }[];
}
export interface Schedule {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}
export interface OwnAvailability {
  timezone: string;
  schedules: Schedule[];
  timeOffs: {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string | null;
  }[];
}
export function useSlots(shopId: string, serviceId: string, date: string) {
  const { authenticated } = useUser();
  return useQuery<Availability>({
    queryKey: ["availability", shopId, serviceId, date],
    enabled: authenticated && !!shopId && !!serviceId && !!date,
    queryFn: async () =>
      (
        await api.get(`/barber-shops/${shopId}/availability`, {
          params: { serviceId, date }
        })
      ).data.data,
  });
}
export function useOwnAvailability(enabled: boolean) {
  const { authenticated } = useUser();
  return useQuery<OwnAvailability>({
    queryKey: ["availability", "me"],
    enabled: enabled && authenticated,
    queryFn: async () =>
      (
        await api.get("/appointments/availability/me")
      ).data.data,
  });
}
export function useBookingMutation<T>(run: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["availability"] }),
        client.invalidateQueries({ queryKey: ["appointments"] }),
      ]);
    },
  });
}
