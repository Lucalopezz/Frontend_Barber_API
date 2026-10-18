import { z } from "zod";

export const ServiceSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  price: z
    .string()
    .trim()
    .min(1, "Informe o preço")
    .regex(
      /^\d+(?:[.,]\d{1,2})?$/,
      "Use um valor positivo com até 2 casas decimais",
    )
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(z.number().finite("Preço inválido").min(0, "Preço inválido")),
  description: z.string().min(1, "Informe a descrição"),
  duration: z
    .string()
    .trim()
    .regex(/^\d+$/, "Informe a duração em minutos")
    .transform(Number)
    .pipe(z.number().int().min(1, "Duração mínima de 1 minuto")),
});
export type ServiceFields = z.input<typeof ServiceSchema>;
export type ServiceValues = z.output<typeof ServiceSchema>;
