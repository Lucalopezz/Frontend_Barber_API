import { ROLES } from "@/types/user.type";
import * as z from "zod";

export const registerSchema = z
  .object({
    email: z
      .email({ message: "E-mail inválido" })
      .min(1, { message: "E-mail inválido" })
      .max(255, { message: "E-mail inválido" }),
    password: z.string().min(6, { message: "Senha muito curta" }).max(255),
    confirmPassword: z
      .string()
      .min(6, { message: "Senha muito curta" })
      .max(255),
    name: z.string().min(2, { message: "Nome muito curto" }).max(255),
    role: z.enum(ROLES, { message: "Cargo inválida" }),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterData = z.infer<typeof registerSchema>;
