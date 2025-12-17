import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export const useCreateService = () => {
  const token = localStorage.getItem("token");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Service, "id" | "createdAt">) => {
      const { data } = await api.post("/services", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["barber-shops"] });
    },
  });
};
