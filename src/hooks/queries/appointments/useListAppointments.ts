import { useUser } from "@/hooks/useUser";
import type { Appointment } from "@/types/appointment.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { getSessionSnapshot } from "@/auth/session";
import { appointmentKeys } from "./queryKeys";
import { queryPolicies } from "./queryPolicies";

export interface ListAppointmentsParams {
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: SortDirection;

  // filters
  serviceId?: string;
  date?: string;
}

export type SortDirection = "asc" | "desc";

interface ListAppointmentsReturn {
  data: Appointment[];
  meta: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
}

export const useListAppointments = (params: ListAppointmentsParams) => {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<ListAppointmentsReturn>({
    queryKey: appointmentKeys.list(sessionId, params),
    queryFn: async () => {
      const { data } = await api.get("/appointments", {
        params: params,
      });
      return data;
    },
    enabled: authenticated && !!sessionId,
    staleTime: queryPolicies.appointments.staleTime,
    refetchInterval: queryPolicies.appointments.refetchInterval,
    refetchIntervalInBackground: false,
  });
};
