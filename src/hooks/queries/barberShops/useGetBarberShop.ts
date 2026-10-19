import { useUser } from "@/hooks/useUser";
import type { BarberShop } from "@/types/barberShop.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const useGetBarberShop = (id?: string) => {

  const { authenticated } = useUser();
  return useQuery<BarberShop>({
    queryKey: ["barber-shop", id],
    queryFn: async () => {
      const { data } = await api.get(`/barber-shops/${id}`);
      return data.data;
    },
    enabled: authenticated && !!id,
  });
};
