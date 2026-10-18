import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterData,
} from "@/pages/auth/types/register.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Link } from "react-router-dom";

interface RegisterProps {
  onSubmit: (data: RegisterData) => Promise<void> | void;
  loading: boolean;
}

export const RegisterForm = ({ onSubmit, loading }: RegisterProps) => {
  const form = useForm<RegisterData>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "client",
    },
    resolver: zodResolver(registerSchema),
  });

  async function handleSubmit(values: RegisterData) {
    await onSubmit(values);
  }

  return (
    <div className="w-full">
      <h1 className="page-title mb-8">Crie sua conta.</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Nome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite seu nome"
                    {...field}
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">E‑mail</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seu@exemplo.com"
                    {...field}
                    autoComplete="email"
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
                <FormLabel className="text-sm">Senha</FormLabel>
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Confirmar senha</FormLabel>
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
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Como você vai usar a Barber?
                </FormLabel>
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

          <div>
            <div className="w-full">
              <Button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center gap-2"
              >
                <LogIn size={16} />
                {loading ? "Criando conta…" : "Criar conta"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-center">
            Já tem uma conta?{" "}
            <Link to="/login" className="font-medium hover:underline">
              <strong>Entrar</strong>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};
