import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateServiceCatalog, invalidateShopCatalog } from "@/hooks/queries/catalogCache";

export const useDeleteBarberShop = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/barber-shops/${shopId}`);

      return response.data;
    },

    onSuccess: () => {
      return Promise.all([
        invalidateShopCatalog(queryClient),
        invalidateServiceCatalog(queryClient),
        queryClient.invalidateQueries({ queryKey: ["user"] }),
      ]);
    },
  });
};
