import type { BarberShop } from "@/types/barberShop.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const useGetBarberShop = (id?: string) => {
  const token = localStorage.getItem("token");

  return useQuery<BarberShop>({
    queryKey: ["barber-shop"],
    queryFn: async () => {
      const { data } = await api.get(`/barber-shop/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data.data;
    },
    enabled: !!token && !!id,
  });
};
