import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Scissors } from "lucide-react";
export const Services = () => (
  <section className="page-section max-w-4xl mx-auto space-y-8">
    <header>
      <h1 className="page-title">Um horário, sem complicar.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Escolha como você vai usar a Barber.
      </p>
    </header>
    <div className="grid gap-6 md:grid-cols-2">
      <article className="panel">
        <CalendarDays
          aria-hidden="true"
          className="mb-5 size-7 text-[#883d43]"
        />
        <h2 className="section-title">Quero agendar</h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm text-muted-foreground">
          <li>Crie sua conta de cliente e entre.</li>
          <li>Encontre a barbearia e toque em Agendar.</li>
          <li>Escolha o serviço, o profissional, a data e um horário disponível.</li>
          <li>Confirme e acompanhe em Agendamentos.</li>
        </ol>
        <p className="mt-6 border-t pt-4 text-sm">
          Você pode cancelar até 24 horas antes do atendimento.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Encontrar barbearia</Link>
        </Button>
      </article>
      <article className="panel">
        <Scissors aria-hidden="true" className="mb-5 size-7 text-[#883d43]" />
        <h2 className="section-title">Quero atender</h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm text-muted-foreground">
          <li>Crie sua conta como barbeiro.</li>
          <li>Cadastre sua barbearia ou aceite um convite para entrar em uma equipe.</li>
          <li>Como proprietário, adicione serviços, valores e duração.</li>
          <li>Defina seu próprio expediente e acompanhe os atendimentos na agenda.</li>
        </ol>
        <p className="mt-6 border-t pt-4 text-sm">
          Cadastre folgas para fechar horários sem alterar reservas existentes.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/signup">Criar conta profissional</Link>
        </Button>
      </article>
    </div>
  </section>
);
