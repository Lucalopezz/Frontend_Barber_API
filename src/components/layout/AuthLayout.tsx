import type { ReactNode } from "react";
import { BarberIllustration } from "./BarberIllustration";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="auth-layout">
      <div className="auth-art">
        <h2 className="font-['Barlow_Condensed'] text-6xl font-bold leading-none">
          O próximo horário
          <br />é seu.
        </h2>
        <p className="mt-5 max-w-xs text-sm text-white/75">
          Corte, barba e um tempo para você. Escolha sua barbearia e marque seu
          horário.
        </p>
        <BarberIllustration className="mx-auto mt-5 w-full max-w-sm" />
      </div>
      <div className="mx-auto w-full max-w-md py-8">{children}</div>
    </section>
  );
}
