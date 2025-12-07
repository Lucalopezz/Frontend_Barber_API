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
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import type { User } from "@/types/user.type";
import { showToast } from "@/utils/toast";
import { useUpdateUserPassword } from "@/hooks/queries/useUpdateUserPassword";

const updateUserPasswordSchema = z.object({
  oldPassword: z.string().min(6, { message: "Senha muito curta" }).max(255),
  password: z.string().min(6, { message: "Senha muito curta" }).max(255),
});

export type UpdateUserPasswordData = z.infer<typeof updateUserPasswordSchema>;

export const UpdateUserPasswordForm = ({
  user,
}: {
  user: User | undefined;
}) => {
  const { mutate, isPending } = useUpdateUserPassword(user?.id);

  const form = useForm<UpdateUserPasswordData>({
    defaultValues: {
      oldPassword: "",
      password: "",
    },
    resolver: zodResolver(updateUserPasswordSchema),
  });

  async function handleSubmit(values: UpdateUserPasswordData) {
    mutate(values, {
      onSuccess: () => {
        showToast("Senha atualizada com sucesso!");
        form.reset();
      },
    });
  }

  return (
    <div className="w-full max-w-md bg-slate-50 shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Atualizar sua senha:</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Senha Antiga</Label>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    autoComplete="old-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Senha Nova</Label>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    autoComplete="new-password"
                  />
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
                {isPending ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
