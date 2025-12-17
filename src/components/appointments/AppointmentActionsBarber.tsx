import { Button } from "@/components/ui/button";
import { useChangeStatus } from "@/hooks/queries/appointments/useChangeStatus";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";
import { showToast } from "@/utils/toast";

export const AppointmentActionsBarber = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const { mutate, error } = useChangeStatus(appointment.id);
  const changeStatus = (status: AppointmentStatus) => {
    mutate({ newStatus: status });
    if (error) {
      showToast("Erro ao alterar status do agendamento");
    } else {
      showToast("Status do agendamento alterado com sucesso!");
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => changeStatus("completed")}
      >
        Concluir
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => changeStatus("cancelled")}
      >
        Cancelar
      </Button>
    </div>
  );
};
