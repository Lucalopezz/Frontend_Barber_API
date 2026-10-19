import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentKeys, availabilityKeys } from "./queryKeys";

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
      await queryClient.invalidateQueries({ queryKey: availabilityKeys.root });
      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.root,
      });
    },
  });
};
