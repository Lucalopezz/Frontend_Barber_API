import { useUser } from "@/hooks/useUser";
import type { BarberShop } from "@/types/barberShop.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { catalogIdentity, catalogKeys, CATALOG_GC_TIME, CATALOG_STALE_TIME } from "@/hooks/queries/catalogCache";

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
  const identity = catalogIdentity();
  return useQuery<ListBarberShopsReturn>({
    queryKey: catalogKeys.shopList(identity, params),
    queryFn: async () => {
      const { data } = await api.get("/barber-shops", {
        params,
      });

      return data;
    },
    enabled: authenticated,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
};
