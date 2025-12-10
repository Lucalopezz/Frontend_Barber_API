import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { BarberShop } from "@/types/barberShop.type";
import { useUpdateBarberShop } from "@/hooks/queries/barberShops/useUpdateBarberShop";


const formSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  address: z
    .string()
    .regex(
      /^(.+),\s*\d+,\s*.+\s*–\s*[A-Z]{2}$/,
      "Formato inválido. Ex: Rua das Flores, 133, São Paulo – SP",
    ),
});

type ShopUpdateFormProps = {
  shop: BarberShop;
};

type formType = z.infer<typeof formSchema>;

export const ShopUpdateForm = ({ shop }: ShopUpdateFormProps) => {
  const [editing, setEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shop.name,
      address: shop.address,
    },
  });

  const updateMutation = useUpdateBarberShop(shop.id);

  const onSubmit = (data: formType) => {
    updateMutation.mutate(data, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Atualizar Informações</CardTitle>

        <Button variant="outline" onClick={() => setEditing(!editing)}>
          <Pencil className="w-4 h-4 mr-2" /> Editar
        </Button>
      </CardHeader>

      <CardContent>
        {editing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Barbearia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua X, 123, Cidade – UF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Salvar alterações
              </Button>
            </form>
          </Form>
        ) : (
          <p className="text-gray-600 text-sm">
            Clique em editar para alterar nome e endereço.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
