export const roles = ["barber", "client"] as const;

export type Role = (typeof roles)[number];
