import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateShopCatalog } from "@/hooks/queries/catalogCache";

export const useUpdateBarberShop = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      const response = await api.put(`/barber-shops/${shopId}`, data);

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
