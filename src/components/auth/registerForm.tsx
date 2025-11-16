import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterData,
} from "@/pages/auth/types/register.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
    <div className="max-w-md w-full mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Criar uma conta na Barber</h2>

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
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">E‑mail</Label>
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
                <Label className="text-sm">Senha</Label>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    autoComplete="current-password"
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
                <Label className="text-sm">Senha</Label>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    autoComplete="confirm-password"
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
                disabled={loading}
                className="inline-flex items-center gap-2"
              >
                <LogIn size={16} />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-center">
            Já tem uma conta conta?{" "}
            <Link to="/login" className="font-medium hover:underline">
              <strong>Entrar</strong>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};
