import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateBarberShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      const response = await api.post(`/barber-shops`, data);

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-shops"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
