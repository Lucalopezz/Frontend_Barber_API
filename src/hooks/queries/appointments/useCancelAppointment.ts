import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCancelAppointment = (appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(
        `/appointments/${appointmentId}`,
        { newStatus: "cancelled" },
        {
        },
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
      await queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};
