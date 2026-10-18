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
import {
  ServiceSchema,
  type ServiceFields,
  type ServiceValues,
} from "./service-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useCreateService } from "@/hooks/queries/services/useCreateService";
import { Textarea } from "../ui/textarea";

export const CreateServiceForm = () => {
  const form = useForm<ServiceFields, unknown, ServiceValues>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: { name: "", price: "", description: "", duration: "30" },
  });

  const create = useCreateService();

  const onSubmit = (values: ServiceValues) => {
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
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 45,00"
                      autoComplete="off"
                      {...field}
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
                    <Input type="text" inputMode="numeric" {...field} />
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
                    <Textarea {...field} placeholder="Descreva o serviço" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {create.isError && (
              <p role="alert" className="text-sm text-destructive">
                Não foi possível criar o serviço. Seus dados foram mantidos;
                tente novamente.
              </p>
            )}
            {create.isSuccess && (
              <p role="status" className="text-sm">
                Serviço criado.
              </p>
            )}
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
