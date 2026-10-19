import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateShopCatalog } from "@/hooks/queries/catalogCache";

export const useCreateBarberShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      const response = await api.post(`/barber-shops`, data);

      return response.data;
    },

    onSuccess: () => {
      return Promise.all([
        invalidateShopCatalog(queryClient),
        queryClient.invalidateQueries({ queryKey: ["user"] }),
      ]);
    },
  });
};
