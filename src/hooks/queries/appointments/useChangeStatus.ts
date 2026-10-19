import type { AppointmentStatus } from "@/types/appointment.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useChangeStatus = (appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newStatus: AppointmentStatus }) => {
      await api.patch(`/appointments/${appointmentId}`, data);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
