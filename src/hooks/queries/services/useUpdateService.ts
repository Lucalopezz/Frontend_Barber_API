import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export const useUpdateService = (serviceId: string) => {
  const token = localStorage.getItem("token");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Service>) => {
      const { data } = await api.patch(`/services/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
};
