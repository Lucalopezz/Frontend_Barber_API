import type { AppointmentStatus } from "@/types/appointment.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useChangeStatus = (appointmentId: string) => {
  const accessToken = localStorage.getItem("token");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newStatus: AppointmentStatus }) => {
      await api.patch(`/appointments/${appointmentId}`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
