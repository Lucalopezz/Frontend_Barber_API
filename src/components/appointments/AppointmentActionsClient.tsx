import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/appointment.type";
import { useCancelAppointment } from "@/hooks/queries/appointments/useCancelAppointment";
export const AppointmentActionsClient = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const mutation = useCancelAppointment(appointment.id);
  const [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState("");
  async function cancel() {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync();
      setConfirm(false);
      setMessage("Agendamento cancelado.");
    } catch {
      setMessage("Erro ao cancelar agendamento. Tente novamente.");
    }
  }
  return (
    <div className="space-y-2 pt-2">
      {!confirm ? (
        <Button variant="destructive" onClick={() => setConfirm(true)}>
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
