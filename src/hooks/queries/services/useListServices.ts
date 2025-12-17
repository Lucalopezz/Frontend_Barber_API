import type { Service } from "@/types/services.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

interface ListServicesReturn {
  data: Service[];
}

export const useListServices = () => {
  const token = localStorage.getItem("token");

  return useQuery<ListServicesReturn>({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await api.get("/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: !!token,
  });
};
