import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useListBarberShops } from "@/hooks/queries/barberShops/useListBarbershops";
import { useListServices } from "@/hooks/queries/services/useListServices";
import api from "@/utils/api";

type ToolName = "search_catalog" | "list_services" | "get_availability";
interface AssistantAnswer {
  answer: string;
  provider: "simulated";
  toolCalls: {
    name: ToolName;
    arguments: Record<string, unknown>;
    result: unknown;
  }[];
}
interface Exchange {
  question: string;
  response: AssistantAnswer;
}
const sourceNames: Record<ToolName, string> = {
  search_catalog: "Catálogo",
  list_services: "Serviços",
  get_availability: "Disponibilidade",
};
const selectClass =
  "block w-full rounded-md border bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700";

// A new authenticated session always receives a fresh component, with no shared
// conversation cache or browser persistence. Requests are additionally aborted
// and their token checked before accepting a late response.
export function AssistantPage() {
  const token = localStorage.getItem("token") ?? "";
  return <AssistantSession key={token} token={token} />;
}

function AssistantSession({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [shopId, setShopId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const shops = useListBarberShops({ page, perPage: 50 });
  const services = useListServices(shopId);
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const question = message.trim();
    if (request.current) return;
    if (!question) {
      setError("Digite uma pergunta antes de enviar.");
      questionInput.current?.focus();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const context = {
        ...(shopId ? { barberShopId: shopId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(date ? { date } : {}),
      };
      const { data } = await api.post<{ data: AssistantAnswer }>(
        "/assistant/chat",
        {
          message: question,
          ...(Object.keys(context).length ? { context } : {}),
        },
        {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (controller.signal.aborted || localStorage.getItem("token") !== token)
        return;
      if (data.data.provider !== "simulated")
        throw new Error("Unexpected provider");
      setHistory((previous) => [
        ...previous,
        { question, response: data.data },
      ]);
      setMessage("");
      questionInput.current?.focus();
    } catch {
      if (
        !controller.signal.aborted &&
        localStorage.getItem("token") === token
      ) {
        setError(
          "Não foi possível consultar agora. Sua pergunta foi mantida; tente enviar novamente.",
        );
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
          Modo simulado
        </p>
        <h1 className="text-2xl font-semibold text-balance">
          Assistente de consultas
        </h1>
        <p>
          Este simulador consulta o catálogo e os horários do sistema. Não
          realiza agendamentos nem cancelamentos e não usa um modelo de IA.
        </p>
        <p className="text-sm text-slate-600">
          Cada pergunta usa somente o contexto selecionado abaixo. O histórico
          aparece apenas nesta tela e não é enviado nas próximas perguntas.
        </p>
      </div>
      <fieldset disabled={pending} className="space-y-4 rounded-xl border p-4">
        <legend className="px-1 font-semibold">
          Contexto opcional da consulta
        </legend>
        <label className="block space-y-1">
          Barbearia
          <select
            aria-label="Barbearia"
            name="barberShopId"
            className={selectClass}
            value={shopId}
            onChange={(event) => {
              setShopId(event.target.value);
              setServiceId("");
            }}
          >
            <option value="">Todas / buscar pela pergunta</option>
            {shops.data?.data.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </label>
        {shops.isLoading && <p role="status">Carregando barbearias…</p>}
        {shops.isError && (
          <p role="alert">
            Não foi possível carregar o catálogo.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => shops.refetch()}
            >
              Recarregar catálogo
            </button>
          </p>
        )}
        {shops.data?.data.length === 0 && <p>Nenhuma barbearia cadastrada.</p>}
        {(shops.data?.meta.lastPage ?? 1) > 1 && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Barbearias anteriores
            </Button>
            <span>Página {page}</span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= (shops.data?.meta.lastPage ?? 1)}
              onClick={() => setPage((value) => value + 1)}
            >
              Próximas barbearias
            </Button>
          </div>
        )}
        <label className="block space-y-1">
          Serviço
          <select
            aria-label="Serviço"
            name="serviceId"
            className={selectClass}
            disabled={!shopId || services.isLoading}
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="">
              Selecione uma barbearia e, se desejar, um serviço
            </option>
            {services.data?.data.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {service.duration} min
              </option>
            ))}
          </select>
        </label>
        {shopId && services.isLoading && (
          <p role="status">Carregando serviços…</p>
        )}
        {services.isError && (
          <p role="alert">
            Não foi possível carregar os serviços.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => services.refetch()}
            >
              Recarregar serviços
            </button>
          </p>
        )}
        {shopId && services.data?.data.length === 0 && (
          <p>Nenhum serviço disponível nesta barbearia.</p>
        )}
        <label className="block space-y-1">
          Data
          <Input
            type="date"
            name="date"
            autoComplete="off"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <p className="text-sm text-slate-600">
          Para consultar horários, selecione barbearia, serviço e data. Os
          horários usam o fuso da barbearia e podem mudar até a confirmação da
          reserva.
        </p>
      </fieldset>
      <div
        className="space-y-4"
        role="log"
        aria-label="Histórico de consultas"
        aria-live="polite"
        aria-relevant="additions"
      >
        {history.length === 0 && (
          <p className="text-slate-600">
            Experimente: “Quais barbearias estão disponíveis?”, “Quais
            serviços?” ou “Quais horários?”
          </p>
        )}
        {history.map((exchange, index) => (
          <article
            key={index}
            className="space-y-3 rounded-xl border p-4 break-words"
          >
            <p className="whitespace-pre-wrap">
              <span className="font-semibold">Você: </span>
              <span>{exchange.question}</span>
            </p>
            <p className="whitespace-pre-wrap">
              <span className="font-semibold">Simulador: </span>
              <span>{exchange.response.answer}</span>
            </p>
            {exchange.response.toolCalls.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2">
                  Fontes consultadas
                </summary>
                <p className="my-2 text-slate-600">
                  Dados retornados pelas consultas nesta resposta.
                  Identificadores aparecem aqui para estudo.
                </p>
                {exchange.response.toolCalls.map((tool, toolIndex) => (
                  <div key={toolIndex} className="mt-3 space-y-1">
                    <h2 className="font-semibold">{sourceNames[tool.name]}</h2>
                    <p>Parâmetros</p>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2">
                      {JSON.stringify(tool.arguments, null, 2)}
                    </pre>
                    <p>Resultado</p>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2">
                      {JSON.stringify(tool.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </details>
            )}
          </article>
        ))}
      </div>
      <form onSubmit={submit} aria-busy={pending} className="space-y-3">
        <label className="block space-y-1">
          Sua pergunta
          <Textarea
            ref={questionInput}
            name="question"
            autoComplete="off"
            required
            maxLength={1000}
            rows={3}
            value={message}
            disabled={pending}
            placeholder="Ex.: Quais serviços essa barbearia oferece?…"
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Consultando…" : "Enviar pergunta"}
        </Button>
        {pending && <p role="status">Consultando as fontes do sistema…</p>}
      </form>
    </section>
  );
}
