import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export const Contact = () => (
  <section className="page-section max-w-3xl mx-auto space-y-7">
    <header>
      <h1 className="page-title">Como podemos ajudar?</h1>
      <p className="mt-4 text-muted-foreground">
        Encontre o próximo passo para o que você precisa.
      </p>
    </header>
    <div className="panel space-y-6">
      <div>
        <h2 className="font-bold">Quero cancelar um horário</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Abra seus agendamentos e escolha Cancelar. O prazo do cliente é de até
          24 horas antes do início.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/appointments">Ver agendamentos</Link>
        </Button>
      </div>
      <div className="border-t pt-6">
        <h2 className="font-bold">Não encontrei horários</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente outra data ou serviço. A disponibilidade depende do expediente e
          dos horários já reservados.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/">Encontrar barbearia</Link>
        </Button>
      </div>
      <div className="border-t pt-6">
        <h2 className="font-bold">Estou começando agora</h2>
        <Link to="/services" className="mt-2 inline-block text-sm underline">
          Veja como agendar ou cadastrar sua barbearia
        </Link>
      </div>
    </div>
  </section>
);
