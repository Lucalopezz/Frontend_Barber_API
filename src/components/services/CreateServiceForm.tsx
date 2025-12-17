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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useCreateService } from "@/hooks/queries/services/useCreateService";
import { Textarea } from "../ui/textarea";

const ServiceSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  price: z.number().min(0, "Preço inválido"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duração inválida (minutos)"),
});

type ServiceForm = z.infer<typeof ServiceSchema>;

export const CreateServiceForm = () => {
  const form = useForm<ServiceForm>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: { name: "", price: 0, description: "", duration: 30 },
  });

  const create = useCreateService();

  const onSubmit = (values: ServiceForm) => {
    create.mutate(
      { ...values },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus size={18} /> Novo Serviço
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Corte masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? 30}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Opcional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending}
            >
              Criar Serviço
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
