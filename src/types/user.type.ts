export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  createdAt: string;
}

export type Role = "barber" | "client";
