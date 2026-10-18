import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  ServiceSchema,
  type ServiceFields,
  type ServiceValues,
} from "./service-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import type { Service } from "@/types/services.type";
import { useUpdateService } from "@/hooks/queries/services/useUpdateService";

export const ServiceEditDialog = ({ service }: { service: Service }) => {
  const form = useForm<ServiceFields, unknown, ServiceValues>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: service.name,
      price: String(service.price).replace(".", ","),
      description: service.description ?? "",
      duration: String(service.duration),
    },
  });

  const update = useUpdateService(service.id);

  const onSubmit = (values: ServiceValues) => {
    update.mutate(values);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Pencil className="w-4 h-4" /> Editar
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Editar serviço</DialogTitle>
        <DialogDescription>
          Atualize o valor, a duração ou a descrição.
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {update.isError && (
              <p role="alert" className="text-sm text-destructive">
                Não foi possível salvar o serviço. Seus dados foram mantidos;
                tente novamente.
              </p>
            )}
            {update.isSuccess && (
              <p role="status" className="text-sm">
                Serviço salvo.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={update.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
