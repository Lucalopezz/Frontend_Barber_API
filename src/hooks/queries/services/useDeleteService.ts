import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateServiceCatalog } from "@/hooks/queries/catalogCache";

export const useDeleteService = (serviceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/services/${serviceId}`);
      return data;
    },
    onSuccess: () => invalidateServiceCatalog(qc),
  });
};
