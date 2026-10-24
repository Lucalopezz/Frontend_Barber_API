import { getSessionSnapshot } from "@/auth/session";
import { useUser } from "@/hooks/useUser";
import api from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ShopBarber = { id: string; name: string; role: "owner" | "barber" };
export type ShopInvitation = {
  id: string;
  email: string;
  barberShopId: string;
  shopName: string;
  barberId: string;
  barberName: string;
  createdAt: string;
};

export function useShopBarbers(shopId: string) {
  return useQuery<ShopBarber[]>({
    queryKey: ["shop-barbers", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const data = (await api.get(`/barber-shops/${shopId}/barbers`)).data.data;
      if (!Array.isArray(data)) throw new Error("Invalid barber list");
      return data;
    },
  });
}

export function useShopInvitations(shopId: string) {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<ShopInvitation[]>({
    queryKey: ["shop-invitations", sessionId, shopId],
    enabled: authenticated && !!sessionId && !!shopId,
    queryFn: async () => {
      const data = (await api.get(`/barber-shops/${shopId}/invitations`)).data
        .data;
      if (!Array.isArray(data)) throw new Error("Invalid invitation list");
      return data;
    },
  });
}

export function useMyInvitations(enabled: boolean) {
  const { authenticated } = useUser();
  const sessionId = getSessionSnapshot()?.sessionId;
  return useQuery<ShopInvitation[]>({
    queryKey: ["my-invitations", sessionId],
    enabled: enabled && authenticated && !!sessionId,
    queryFn: async () => {
      const data = (await api.get("/barber-shops/invitations/me")).data.data;
      if (!Array.isArray(data)) throw new Error("Invalid invitation list");
      return data;
    },
  });
}

export function useTeamAction<T>(run: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["shop-barbers"] }),
        client.invalidateQueries({ queryKey: ["shop-invitations"] }),
        client.invalidateQueries({ queryKey: ["my-invitations"] }),
        client.invalidateQueries({ queryKey: ["user"] }),
      ]);
    },
  });
}
