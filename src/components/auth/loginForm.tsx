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
import { LoaderCircle, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/pages/auth/types/login.types";
import { Link } from "react-router-dom";

interface LoginProps {
  onSubmit: (data: LoginData) => Promise<void> | void;
  sessionExpired?: boolean;
}

export const LoginForm = ({ onSubmit, sessionExpired }: LoginProps) => {
  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });
  const { isSubmitting } = form.formState;

  async function handleSubmit(values: LoginData) {
    await onSubmit(values);
  }

  return (
    <div className="w-full">
      <h1 className="page-title mb-3">Entrar na Barber</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Acesse sua conta para cuidar dos seus horários.
      </p>

      {sessionExpired && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          Sessão expirada. Faça login novamente.
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          aria-busy={isSubmitting}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">E‑mail</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seu@exemplo.com"
                    type="email"
                    {...field}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage role="alert" />
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
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage role="alert" />
              </FormItem>
            )}
          />

          <div>
            <div className="w-full">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center gap-2"
              >
                {isSubmitting ? (
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <LogIn size={16} aria-hidden="true" />
                )}
                {isSubmitting ? "Entrando…" : "Entrar"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-center">
            Ainda não tem conta?{" "}
            <Link to="/signup" className="font-medium hover:underline">
              <strong>Criar conta</strong>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};
