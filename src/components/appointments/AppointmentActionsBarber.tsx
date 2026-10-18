import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChangeStatus } from "@/hooks/queries/appointments/useChangeStatus";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { BookingForm } from "@/components/booking/BookingForm";
export const AppointmentActionsBarber = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const mutation = useChangeStatus(appointment.id);
  const [message, setMessage] = useState(""),
    [edit, setEdit] = useState(false);
  async function changeStatus(status: AppointmentStatus) {
    if (mutation.isPending) return;
    setMessage("");
    try {
      await mutation.mutateAsync({ newStatus: status });
      setMessage("Status do agendamento alterado com sucesso!");
    } catch {
      setMessage("Erro ao alterar status do agendamento. Tente novamente.");
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => changeStatus("completed")}
        >
          Concluir
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={mutation.isPending}
          onClick={() => changeStatus("cancelled")}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => setEdit(!edit)}
        >
          {edit ? "Fechar remarcação" : "Remarcar"}
        </Button>
      </div>
      {message && <p role={mutation.isError ? "alert" : "status"}>{message}</p>}
      {edit && (
        <BookingForm
          shopId={appointment.barberShopId}
          appointmentId={appointment.id}
          initialServiceId={appointment.serviceId}
        />
      )}
    </div>
  );
};
