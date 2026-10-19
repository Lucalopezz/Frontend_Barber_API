import { getIdentity, isCurrentIdentity } from "@/auth/session";
import { CanceledError } from "axios";
import { discardOtherAccountDraft } from "@/auth/bookingDraft";
import { useUser } from "@/hooks/useUser";
import type { User } from "@/types/user.type";
import api from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const useGetUser = () => {
  const { authenticated } = useUser();
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const generation = getIdentity().generation;
      const { data } = await api.get("/users/me");
      if (!isCurrentIdentity(generation)) throw new CanceledError("Resposta de identidade anterior.");
      discardOtherAccountDraft(data.data.id);
      return data.data;
    },
    enabled: authenticated,
  });
};
