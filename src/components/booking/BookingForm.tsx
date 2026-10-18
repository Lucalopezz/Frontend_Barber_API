import { useState } from "react";
import { isAxiosError } from "axios";
import { useListServices } from "@/hooks/queries/services/useListServices";
import {
  authHeaders,
  useBookingMutation,
  useSlots,
} from "@/hooks/queries/appointments/useBooking";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { Link } from "react-router-dom";
export function BookingForm({
  shopId,
  appointmentId,
  initialServiceId = "",
}: {
  shopId: string;
  appointmentId?: string;
  initialServiceId?: string;
}) {
  const [serviceId, setServiceId] = useState(initialServiceId),
    [date, setDate] = useState(""),
    [slot, setSlot] = useState(""),
    [message, setMessage] = useState("");
  const services = useListServices(shopId),
    slots = useSlots(shopId, serviceId, date);
  const mutation = useBookingMutation<void>(async () => {
    const input = { serviceId, date: slot };
    if (appointmentId)
      await api.put(`/appointments/${appointmentId}`, input, {
        headers: authHeaders(),
      });
    else await api.post("/appointments", input, { headers: authHeaders() });
  });
  const pending = mutation.isPending;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !slot) return;
    setMessage("");
    try {
      await mutation.mutateAsync(undefined);
      setSlot("");
      setMessage(
        appointmentId ? "Agendamento remarcado." : "Agendamento criado.",
      );
    } catch (error) {
      setSlot("");
      if (isAxiosError(error) && error.response?.status === 409) {
        setMessage(
          "Horário indisponível. Os horários foram atualizados; escolha novamente.",
        );
        await slots.refetch();
      } else setMessage("Erro ao salvar agendamento. Tente novamente.");
    }
  }
  return (
    <form
      onSubmit={submit}
      aria-busy={pending}
      className="space-y-4 border rounded-xl p-4"
    >
      <h2 className="text-xl font-semibold">
        {appointmentId ? "Remarcar agendamento" : "Escolha serviço e horário"}
      </h2>
      <p className="text-sm text-slate-600">
        Reservas e remarcações exigem pelo menos 30 minutos de antecedência, com
        limite de 60 dias. Os horários de início seguem uma grade de 30 minutos
        no fuso da barbearia. Clientes podem cancelar até 24 horas antes do
        início.
      </p>
      {services.isLoading && <p>Carregando serviços…</p>}
      {services.isError && (
        <p role="alert">
          Erro ao carregar serviços.{" "}
          <button type="button" onClick={() => services.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {services.data?.data.length === 0 && (
        <p>Nenhum serviço disponível nesta barbearia.</p>
      )}
      <label className="block">
        Serviço
        <select
          aria-label="Serviço"
          className="block border rounded p-2 w-full"
          required
          disabled={pending}
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSlot("");
            setMessage("");
          }}
        >
          <option value="">Selecione</option>
          {services.data?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} —{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(s.price))}{" "}
              — {s.duration} min
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Data
        <input
          className="block border rounded p-2"
          type="date"
          required
          value={date}
          disabled={pending}
          onChange={(e) => {
            setDate(e.target.value);
            setSlot("");
            setMessage("");
          }}
        />
      </label>
      {slots.data && <p>Horários no fuso {slots.data.timezone}.</p>}
      {slots.isFetching && <p>Consultando horários…</p>}
      {slots.isError && (
        <p role="alert">
          Erro ao consultar horários.{" "}
          <button type="button" onClick={() => slots.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {slots.data && !slots.isFetching && slots.data.slots.length === 0 && (
        <p>Nenhum horário disponível nesta data.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!slots.isFetching &&
          slots.data?.slots.map((s) => (
            <Button
              key={s.startsAt}
              type="button"
              variant={slot === s.startsAt ? "default" : "outline"}
              aria-pressed={slot === s.startsAt}
              disabled={pending}
              onClick={() => {
                setSlot(s.startsAt);
                setMessage("");
              }}
            >
              {new Intl.DateTimeFormat("pt-BR", {
                timeZone: slots.data.timezone,
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(s.startsAt))}
            </Button>
          ))}
      </div>
      <Button disabled={pending || !slot || slots.isFetching} type="submit">
        {pending
          ? "Salvando…"
          : appointmentId
            ? "Confirmar remarcação"
            : "Confirmar agendamento"}
      </Button>
      {message && (
        <p role={mutation.isError ? "alert" : "status"}>
          {message}{" "}
          {mutation.isSuccess && (
            <Link className="underline" to="/appointments">
              Ver agendamentos
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
