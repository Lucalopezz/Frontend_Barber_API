import { shopTimeToIso } from "@/utils/shopTime";
import { useState } from "react";
import {
  useBookingMutation,
  useOwnAvailability,
  type Schedule,
} from "@/hooks/queries/appointments/useBooking";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
const days = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const minutes = (value: string) =>
  Number(value.split(":")[0]) * 60 + Number(value.split(":")[1]);
type ScheduleDraft = { dayOfWeek: number; start: string; end: string };

export function AvailabilityManager() {
  const query = useOwnAvailability(true);
  if (query.isLoading) return <p>Carregando expediente…</p>;
  if (!query.data)
    return (
      <p role="alert">
        Erro ao carregar expediente.{" "}
        <button onClick={() => query.refetch()}>Tentar novamente</button>
      </p>
    );
  return (
    <AvailabilityEditor
      initial={query.data.schedules}
      timezone={query.data.timezone}
      timeOffs={query.data.timeOffs}
    />
  );
}
function AvailabilityEditor({
  initial,
  timezone,
  timeOffs,
}: {
  initial: Schedule[];
  timezone: string;
  timeOffs: {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string | null;
  }[];
}) {
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(() =>
      initial.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        start: time(s.startMinute),
        end: time(s.endMinute),
      })),
    ),
    [startsAt, setStart] = useState(""),
    [endsAt, setEnd] = useState(""),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const mutation = useBookingMutation(
    async (action: { kind: "schedule" | "add" | "delete"; id?: string }) => {
      if (action.kind === "schedule")
        await api.put(
          "/appointments/availability/me/schedule",
          {
            schedules: schedules.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startMinute: minutes(s.start),
              endMinute: minutes(s.end),
            })),
          },
          { },
        );
      if (action.kind === "add")
        await api.post(
          "/appointments/availability/me/time-offs",
          {
            startsAt: shopTimeToIso(startsAt, timezone),
            endsAt: shopTimeToIso(endsAt, timezone),
            reason,
          },
          { },
        );
      if (action.kind === "delete")
        await api.delete(
          `/appointments/availability/me/time-offs/${action.id}`,
          { },
        );
    },
  );
  async function run(kind: "schedule" | "add" | "delete", id?: string) {
    if (mutation.isPending) return;
    setMessage("");
    setFailed(false);
    if (
      kind === "schedule" &&
      schedules.some(
        (s) =>
          !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(s.start) ||
          !/^(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/.test(s.end) ||
          minutes(s.start) >= minutes(s.end),
      )
    ) {
      setFailed(true);
      setMessage("O fim do expediente deve ser posterior ao início.");
      return;
    }
    if (kind === "add") {
      try {
        if (
          shopTimeToIso(startsAt, timezone) >= shopTimeToIso(endsAt, timezone)
        )
          throw new Error();
      } catch {
        setFailed(true);
        setMessage(
          "Informe datas válidas no fuso da barbearia, com fim posterior ao início. Horários ambíguos na mudança de horário de verão não são aceitos.",
        );
        return;
      }
    }
    try {
      await mutation.mutateAsync({ kind, id });
      setMessage(
        kind === "schedule"
          ? "Expediente salvo."
          : kind === "add"
            ? "Folga adicionada."
            : "Folga removida.",
      );
      if (kind === "add") {
        setStart("");
        setEnd("");
        setReason("");
      }
    } catch {
      setFailed(true);
      setMessage(
        "Erro ao salvar disponibilidade. Confira os intervalos e tente novamente.",
      );
    }
  }
  function update(index: number, value: Partial<ScheduleDraft>) {
    setSchedules((rows) =>
      rows.map((s, i) => (i === index ? { ...s, ...value } : s)),
    );
  }
  return (
    <section className="space-y-6 panel">
      <h2 className="text-xl font-semibold">Expediente e folgas</h2>
      <p className="text-sm text-muted-foreground">
        Defina quando você atende. Dias sem intervalos ficam fechados. Horários
        no fuso {timezone}.
      </p>
      <p className="rounded-lg bg-secondary p-3 text-sm">
        Alterar o expediente ou adicionar folgas não cancela reservas
        existentes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("schedule");
        }}
        className="space-y-3"
        aria-busy={mutation.isPending}
      >
        {schedules.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end border-b pb-5"
          >
            <label>
              Dia da semana {i + 1}
              <select
                aria-label={`Dia da semana ${i + 1}`}
                className="mt-1 block w-full"
                disabled={mutation.isPending}
                value={s.dayOfWeek}
                onChange={(e) =>
                  update(i, { dayOfWeek: Number(e.target.value) })
                }
              >
                {days.map((day, n) => (
                  <option key={day} value={n}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Início expediente {i + 1}
              <input
                className="mt-1 block w-full"
                type="time"
                required
                disabled={mutation.isPending}
                value={s.start}
                onChange={(e) => update(i, { start: e.target.value })}
              />
            </label>
            <label>
              Fim expediente {i + 1}
              <input
                className="mt-1 block w-full"
                type="text"
                inputMode="numeric"
                pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00"
                title="HH:mm (até 24:00)"
                required
                disabled={mutation.isPending}
                value={s.end}
                onChange={(e) => update(i, { end: e.target.value })}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              aria-label={`Remover intervalo ${i + 1}`}
              disabled={mutation.isPending}
              onClick={() =>
                setSchedules((rows) => rows.filter((_, n) => n !== i))
              }
            >
              Remover
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending || schedules.length >= 21}
            onClick={() =>
              setSchedules((rows) => [
                ...rows,
                { dayOfWeek: 1, start: "09:00", end: "18:00" },
              ])
            }
          >
            Adicionar intervalo
          </Button>
          <Button disabled={mutation.isPending}>Salvar expediente</Button>
        </div>
      </form>
      <h3 className="font-semibold">Folgas</h3>
      <p>Informe o horário local da barbearia ({timezone}).</p>
      <ul className="space-y-2">
        {timeOffs.map((t) => (
          <li key={t.id} className="flex flex-wrap gap-3 items-center">
            {new Date(t.startsAt).toLocaleString("pt-BR", {
              timeZone: timezone,
            })}{" "}
            até{" "}
            {new Date(t.endsAt).toLocaleString("pt-BR", { timeZone: timezone })}{" "}
            {t.reason}
            <Button
              variant="outline"
              disabled={mutation.isPending}
              aria-label={`Remover folga ${t.id}`}
              onClick={() => run("delete", t.id)}
            >
              Remover folga
            </Button>
          </li>
        ))}
      </ul>
      {timeOffs.length === 0 && <p>Nenhuma folga cadastrada.</p>}
      <form
        className="space-y-3"
        aria-busy={mutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          void run("add");
        }}
      >
        <label className="block">
          Início da folga
          <input
            className="block border rounded p-2 w-full"
            type="datetime-local"
            required
            value={startsAt}
            disabled={mutation.isPending}
            placeholder="2030-10-22T09:00:00-03:00"
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="block">
          Fim da folga
          <input
            className="block border rounded p-2 w-full"
            type="datetime-local"
            required
            value={endsAt}
            disabled={mutation.isPending}
            placeholder="2030-10-22T10:00:00-03:00"
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <label className="block">
          Motivo da folga
          <input
            className="block border rounded p-2 w-full"
            maxLength={255}
            value={reason}
            disabled={mutation.isPending}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <Button disabled={mutation.isPending}>Adicionar folga</Button>
      </form>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </section>
  );
}
