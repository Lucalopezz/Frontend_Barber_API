import type { BarberShop } from "./barberShop.type";
export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  createdAt: string;
  barberShop?: (BarberShop & { relationship: "owner" | "barber" }) | null;
}

export const ROLES = ["barber", "client"] as const;
export type Role = (typeof ROLES)[number] | "owner";
