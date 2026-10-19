import type { QueryClient } from "@tanstack/react-query";
import { getIdentity } from "@/auth/session";

export const CATALOG_STALE_TIME = 5 * 60 * 1000;
export const CATALOG_GC_TIME = 10 * 60 * 1000;

export const catalogIdentity = () => getIdentity().sessionId ?? "anonymous";

export const catalogKeys = {
  shopList: (identity: string, params: { page?: number; perPage?: number; filter?: string }) =>
    ["barber-shops", identity, params] as const,
  shop: (identity: string, id?: string) => ["barber-shop", identity, id] as const,
  services: (identity: string, barberShopId: string, perPage: number) =>
    ["services", identity, barberShopId, { perPage }] as const,
};

export async function invalidateShopCatalog(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["barber-shops"] }),
    client.invalidateQueries({ queryKey: ["barber-shop"] }),
  ]);
}

export async function invalidateServiceCatalog(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["services"] }),
    client.invalidateQueries({ queryKey: ["barber-shops"] }),
    client.invalidateQueries({ queryKey: ["barber-shop"] }),
    client.invalidateQueries({ queryKey: ["availability"] }),
    client.invalidateQueries({ queryKey: ["appointments"] }),
  ]);
}
