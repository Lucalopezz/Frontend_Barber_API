import { ROLES, type User } from "@/types/user.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { useUpdateUser } from "@/hooks/queries/useUpdateUser";
import { showToast } from "@/utils/toast";

const updateUserSchema = z.object({
  name: z.string().min(2, { message: "Nome muito curto" }).max(255),
  role: z.enum(ROLES, { message: "Cargo inválida" }),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

export const UpdateUserForm = ({ user }: { user: User | undefined }) => {
  const { mutate, isPending } = useUpdateUser(user?.id);

  const form = useForm<UpdateUserData>({
    // use values because user can be undefined while api is loading
    values: user
      ? {
          name: user.name,
          role: user.role,
        }
      : undefined,
    resolver: zodResolver(updateUserSchema),
  });

  async function handleSubmit(values: UpdateUserData) {
    mutate(values, {
      onSuccess: () => {
        showToast("Perfil atualizado com sucesso!");
      },
    });
  }

  return (
    <div className="w-full max-w-md bg-slate-50 shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Atualizar seus dados:</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Nome</Label>
                <FormControl>
                  <Input
                    placeholder="Digite seu nome"
                    {...field}
                    autoComplete="Seu nome"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Cargo</Label>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="barber">Barbeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div>
              <Button
                type="submit"
                className="inline-flex items-center gap-2"
                disabled={isPending}
              >
                <Send size={16} />
                {isPending ? "Atualizando..." : "Atualizar Perfil"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
