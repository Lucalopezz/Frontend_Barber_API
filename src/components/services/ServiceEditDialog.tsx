import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import type { Service } from "@/types/services.type";
import { useUpdateService } from "@/hooks/queries/services/useUpdateService";

const ServiceSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  description: z.string().optional(),
  duration: z.number().min(1),
});
type ServiceForm = z.infer<typeof ServiceSchema>;

export const ServiceEditDialog = ({ service }: { service: Service }) => {
  const form = useForm<ServiceForm>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: service.name,
      price: service.price,
      description: service.description ?? "",
      duration: service.duration,
    },
  });

  const update = useUpdateService(service.id);

  const onSubmit = (values: ServiceForm) => {
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
                    <Input type="number" step="0.01" {...field} />
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
                    <Input type="number" {...field} />
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
