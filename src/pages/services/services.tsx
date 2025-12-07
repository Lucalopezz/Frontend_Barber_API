import { User, Scissors } from "lucide-react";

export const Services = () => {
  return (
    <div className="max-w-6xl mx-auto pt-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">
          Serviços & Como usar a Barber
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Um mini-tutorial rápido para clientes e barbeiros — passo a passo, sem
          enrolação, para você começar a usar o sistema de agendamento e
          gerenciamento em múltiplas barbearias.
        </p>
      </div>

      <section className="grid gap-8 md:grid-cols-2">
        {/* Usuário (esquerda) */}
        <article className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-slate-100 p-2">
              <User size={20} />
            </div>
            <h2 className="text-xl font-medium">Para Usuários</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Se você quer marcar corte, barba, ou qualquer serviço: é rápido.
            Crie sua conta, escolha uma barbearia, veja os horários disponíveis
            e confirme o atendimento. Abaixo tem um passo a passo com dicas
            práticas.
          </p>

          <ol className="list-decimal ml-5 space-y-3 text-gray-700">
            <li>
              <strong>Criar conta:</strong> registre-se como <em>cliente</em>{" "}
              usando seu e-mail e uma senha segura. Depois confirmamos o login e
              pronto — perfil criado.
            </li>

            <li>
              <strong>Procurar barbearia:</strong> use a busca ou explore a
              lista de barbearias próximas. Abra a página da barbearia para ver
              serviços, avaliações e horários.
            </li>

            <li>
              <strong>Escolher serviço e horário:</strong> selecione o serviço
              (ex.: corte, navalha, coloração), escolha um profissional
              disponível e selecione o horário que mais te convier.
            </li>

            <li>
              <strong>Confirmar agendamento:</strong> revise os detalhes e
              confirme. Você receberá uma notificação/confirm (ou e-mail) com os
              dados do horário.
            </li>
          </ol>

          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Dicas úteis:</strong>
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                Salve suas barbearias favoritas para agendar mais rápido da
                próxima vez.
              </li>
              <li>
                Se precisar alterar ou cancelar, faça isso pelo próprio
                agendamento antes do limite de tempo.
              </li>
              <li>
                Confira as avaliações e fotos dos profissionais antes de
                escolher.
              </li>
            </ul>
          </div>
        </article>

        {/* Barbeiro (direita) */}
        <article className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-slate-100 p-2">
              <Scissors size={20} />
            </div>
            <h2 className="text-xl font-medium">Para Barbeiros</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Se você gerencia uma barbearia ou é um profissional que quer aceitar
            agendamentos, o sistema foi pensado para tornar a gestão simples:
            cadastro da barbearia, horários, funcionários e controle dos
            agendamentos em um só lugar.
          </p>

          <ol className="list-decimal ml-5 space-y-3 text-gray-700">
            <li>
              <strong>Criar conta:</strong> registre-se como <em>barbeiro</em>{" "}
              (ou conta comercial) para ter acesso às funcionalidades de gestão.
            </li>

            <li>
              <strong>Adicionar sua barbearia:</strong> cadastre o nome,
              endereço, fotos e descrição. Quanto mais completa a ficha, maior a
              confiança dos clientes.
            </li>

            <li>
              <strong>Adicionar funcionários e horários:</strong> crie perfis
              para cada funcionário, defina serviços que cada um presta e
              configure horários de atendimento e intervalos.
            </li>

            <li>
              <strong>Gerenciar agendamentos:</strong> confirme, cancele ou
              remarque atendimentos. Use bloqueios de horário para folgas e
              feriados, e ajuste a capacidade por horário.
            </li>
          </ol>

          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Boas práticas:</strong>
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                Configure tempos entre atendimentos para evitar atrasos
                acumulados.
              </li>
              <li>
                Mantenha os horários dos funcionários atualizados (ausências e
                folgas) para evitar cancelamentos de última hora.
              </li>
              <li>
                Use notificações e confirmações para reduzir faltas — é simples
                e aumenta a eficiência da agenda.
              </li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
};
