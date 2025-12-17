import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteService = (serviceId: string) => {
  const token = localStorage.getItem("token");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
};
