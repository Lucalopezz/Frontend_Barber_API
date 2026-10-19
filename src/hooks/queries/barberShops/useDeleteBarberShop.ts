import { logoutSession } from "@/auth/session";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteBarberShop = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/barber-shops/${shopId}`);

      return response.data;
    },

    onSuccess: () => {
      void logoutSession();
      queryClient.invalidateQueries({
        queryKey: ["barber-shop", "barber-shops", "user"],
      });

    },
  });
};
