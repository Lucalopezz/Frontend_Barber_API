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
import { Link, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/pages/auth/types/login.types";

interface LoginProps {
  onSubmit: (data: LoginData) => Promise<void> | void;
  loading: boolean;
}

export const LoginForm = ({ onSubmit, loading }: LoginProps) => {
  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(loginSchema),
  })
  
  async function handleSubmit(values: LoginData){
    await onSubmit(values)
  }
  
  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Entrar na Barber</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-medium hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};
