import { Button } from "@/components/ui/button";
import type { Appointment, AppointmentStatus } from "@/types/appointment.type";

export const AppointmentActionsBarber = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const changeStatus = (status: AppointmentStatus) => {
    console.log(appointment.id, status);
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
