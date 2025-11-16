import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "E-mail inválido" })
    .min(1, { message: "E-mail inválido" })
    .max(255, { message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha muito curta" }).max(255),
});

export type LoginData = z.infer<typeof loginSchema>;
