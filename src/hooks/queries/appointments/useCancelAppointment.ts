import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCancelAppointment = (appointmentId: string) => {
  const accessToken = localStorage.getItem("token");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment"],
      });
    },
  });
};
