import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateBarberShop = () => {
  const accessToken = localStorage.getItem("token");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      const response = await api.post(`/barber-shop`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-shops"] });
    },
  });
};
