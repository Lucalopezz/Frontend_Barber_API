import { useUser } from "@/hooks/useUser";
import api from "@/utils/api";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionSnapshot } from "@/auth/session";
import { appointmentKeys, availabilityKeys } from "./queryKeys";
import { queryPolicies } from "./queryPolicies";

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

export function useSlots(shopId: string, serviceId: string, date: string, barberId: string) {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<Availability>({
    queryKey: availabilityKeys.shop(sessionId, shopId, serviceId, date, barberId),
    enabled: authenticated && !!sessionId && !!shopId && !!serviceId && !!date && !!barberId,
    queryFn: async () =>
      (
        await api.get(`/barber-shops/${shopId}/availability`, {
          params: { serviceId, date, barberId },
        })
      ).data.data,
    staleTime: queryPolicies.availability.staleTime,
    refetchOnMount: "always",
    refetchInterval: queryPolicies.availability.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useOwnAvailability(enabled: boolean) {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<OwnAvailability>({
    queryKey: availabilityKeys.own(sessionId),
    enabled: enabled && authenticated && !!sessionId,
    queryFn: async () => (await api.get("/appointments/availability/me")).data.data,
    staleTime: queryPolicies.availability.staleTime,
    refetchInterval: queryPolicies.availability.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useBookingMutation<T>(run: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: availabilityKeys.root }),
        client.invalidateQueries({ queryKey: appointmentKeys.root }),
      ]);
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        await client.invalidateQueries({ queryKey: availabilityKeys.root });
      }
    },
  });
}
