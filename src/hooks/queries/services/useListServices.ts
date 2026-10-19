import { useUser } from "@/hooks/useUser";
import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { catalogIdentity, catalogKeys, CATALOG_GC_TIME, CATALOG_STALE_TIME } from "@/hooks/queries/catalogCache";

interface ListServicesReturn {
  data: Service[];
  meta?: { lastPage: number };
}

export const useListServices = (barberShopId: string) => {
  const { authenticated } = useUser();
  const identity = catalogIdentity();
  const perPage = 50;
  return useQuery<ListServicesReturn>({
    queryKey: catalogKeys.services(identity, barberShopId, perPage),
    queryFn: async () => {
      async function fetchPage(page: number) {
        const { data } = await api.get<ListServicesReturn>("/services", {
          params: { barberShopId, page, perPage },
        });
        return data;
      }
      const first = await fetchPage(1);
      const remaining = await Promise.all(
        Array.from(
          { length: Math.max(0, (first.meta?.lastPage ?? 1) - 1) },
          (_, i) => fetchPage(i + 2),
        ),
      );
      return {
        data: [...first.data, ...remaining.flatMap((page) => page.data)],
      };
    },
    enabled: authenticated && !!barberShopId,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
};
