import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteBarberShop = (shopId: string) => {
  const accessToken = localStorage.getItem("token");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/barber-shop/${shopId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-shop"] });
      queryClient.invalidateQueries({ queryKey: ["barber-shops"] });
      window.location.href = "/";
    },
  });
};
