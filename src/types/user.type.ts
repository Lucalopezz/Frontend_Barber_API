export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  createdAt: string;
}

export const ROLES = ["barber", "client"] as const;
export type Role = (typeof ROLES)[number];
