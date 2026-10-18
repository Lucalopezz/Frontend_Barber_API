import { Link } from "react-router-dom";
export const Footer = () => (
  <footer className="mt-8 border-t pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
    <div className="app-shell flex flex-wrap items-center justify-between gap-4 py-7 text-xs text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">Barber.</span> Seu
        próximo corte começa aqui.
      </p>
      <div className="flex gap-5">
        <Link className="underline-offset-4 hover:underline" to="/services">
          Como funciona
        </Link>
        <Link className="underline-offset-4 hover:underline" to="/contact">
          Ajuda
        </Link>
      </div>
    </div>
  </footer>
);
