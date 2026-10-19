import type { AppointmentStatus } from "@/types/appointment.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentKeys, availabilityKeys } from "./queryKeys";

export const useChangeStatus = (appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newStatus: AppointmentStatus }) => {
      await api.patch(`/appointments/${appointmentId}`, data);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: availabilityKeys.root });
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.root });
    },
  });
};
