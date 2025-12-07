import type { User } from "@/types/user.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const useGetUser = () => {
  const accessToken = localStorage.getItem("token");
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/users/get-one", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data.data;
    },
    enabled: !!accessToken,
  });
};
