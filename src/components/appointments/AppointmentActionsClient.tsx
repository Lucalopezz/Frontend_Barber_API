import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/appointment.type";
import { useCancelAppointment } from "@/hooks/queries/appointments/useCancelAppointment";

const cancellationWindow = 24 * 60 * 60 * 1000;
const deadlineMessage =
  "O prazo para cancelamento pelo cliente terminou. É necessário cancelar com pelo menos 24 horas de antecedência; entre em contato com a barbearia.";
export const AppointmentActionsClient = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const mutation = useCancelAppointment(appointment.id);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const deadline = new Date(appointment.date).getTime() - cancellationWindow;
  const canCancel = Number.isFinite(deadline) && now <= deadline;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function cancel() {
    if (mutation.isPending) return;
    // The API remains authoritative, including if the deadline passes while
    // this confirmation is open or the local clock differs from the server.
    if (!Number.isFinite(deadline) || Date.now() > deadline) {
      setNow(Date.now());
      setConfirm(false);
      return;
    }
    try {
      await mutation.mutateAsync();
      setConfirm(false);
      setMessage("Agendamento cancelado.");
    } catch (error) {
      setMessage(
        isAxiosError(error) && error.response?.status === 403
          ? "Erro ao cancelar agendamento. O servidor não autorizou a operação. Clientes podem cancelar até 24 horas antes do início; atualize a lista ou entre em contato com a barbearia."
          : "Erro ao cancelar agendamento. Tente novamente.",
      );
    }
  }
  return (
    <div className="space-y-2 pt-2">
      <p className="text-sm text-slate-600">
        Cancelamento pelo cliente até 24 horas antes do início.
      </p>
      {!canCancel && <p role="status">{deadlineMessage}</p>}
      {!confirm || !canCancel ? (
        <Button
          variant="destructive"
          disabled={!canCancel}
          onClick={() => setConfirm(true)}
        >
          Cancelar
        </Button>
      ) : (
        <div role="group" aria-label="Confirmar cancelamento">
          <p>Deseja cancelar este agendamento?</p>
          <Button
            disabled={mutation.isPending}
            variant="destructive"
            onClick={cancel}
          >
            Confirmar cancelamento
          </Button>
          <Button
            disabled={mutation.isPending}
            variant="outline"
            onClick={() => setConfirm(false)}
          >
            Não cancelar
          </Button>
        </div>
      )}
      {message && <p role={mutation.isError ? "alert" : "status"}>{message}</p>}
    </div>
  );
};
