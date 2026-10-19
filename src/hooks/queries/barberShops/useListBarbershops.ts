import { useUser } from "@/hooks/useUser";
import type { BarberShop } from "@/types/barberShop.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export interface ListBarberShopsParams {
  page?: number;
  perPage?: number;
  filter?: string;
}

interface ListBarberShopsReturn {
  data: BarberShop[];
  meta: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
}

export const useListBarberShops = (params: ListBarberShopsParams) => {

  const { authenticated } = useUser();
  return useQuery<ListBarberShopsReturn>({
    queryKey: ["barber-shops", params],
    queryFn: async () => {
      const { data } = await api.get("/barber-shops", {
        params,
      });

      return data;
    },
    enabled: authenticated,
  });
};
