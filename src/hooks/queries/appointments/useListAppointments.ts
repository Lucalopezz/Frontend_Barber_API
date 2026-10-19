import { useUser } from "@/hooks/useUser";
import type { Appointment } from "@/types/appointment.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

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
  return useQuery<ListAppointmentsReturn>({
    queryKey: ["appointments", params],
    queryFn: async () => {
      const { data } = await api.get("/appointments", {
        params: params,
      });
      return data;
    },
    enabled: authenticated,
  });
};
