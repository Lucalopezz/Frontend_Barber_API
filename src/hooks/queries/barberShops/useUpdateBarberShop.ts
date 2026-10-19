import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateBarberShop = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      const response = await api.put(`/barber-shops/${shopId}`, data);

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-shop"] });
      queryClient.invalidateQueries({ queryKey: ["barber-shops"] });
    },
  });
};
