import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCancelAppointment = (appointmentId: string) => {
  const accessToken = localStorage.getItem("token");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(
        `/appointments/${appointmentId}`,
        { newStatus: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
