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
  const accessToken = localStorage.getItem("token");

  return useQuery<ListAppointmentsReturn>({
    queryKey: ["appointment"],
    queryFn: async () => {
      const { data } = await api.get("/appointments", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });
      console.log(data);
      return data || [];
    },
    enabled: !!accessToken,
  });
};
