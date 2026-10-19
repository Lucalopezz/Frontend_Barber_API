import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateServiceCatalog } from "@/hooks/queries/catalogCache";


export const useUpdateService = (serviceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Service>) => {
      const { data } = await api.patch(`/services/${serviceId}`, payload);
      return data;
    },
    onSuccess: () => invalidateServiceCatalog(qc),
  });
};
