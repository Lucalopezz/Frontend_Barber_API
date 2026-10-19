import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateServiceCatalog } from "@/hooks/queries/catalogCache";

export const useCreateService = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Service, "id" | "createdAt" | "barberShopId">) => {
      const { data } = await api.post("/services", payload);
      return data;
    },
    onSuccess: () => invalidateServiceCatalog(qc),
  });
};
