import { useUser } from "@/hooks/useUser";
import type { BarberShop } from "@/types/barberShop.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { catalogIdentity, catalogKeys, CATALOG_GC_TIME, CATALOG_STALE_TIME } from "@/hooks/queries/catalogCache";

export const useGetBarberShop = (id?: string) => {

  const { authenticated } = useUser();
  const identity = catalogIdentity();
  return useQuery<BarberShop>({
    queryKey: catalogKeys.shop(identity, id),
    queryFn: async () => {
      const { data } = await api.get(`/barber-shops/${id}`);
      return data.data;
    },
    enabled: authenticated && !!id,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
};
