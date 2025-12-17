import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import type { Appointment } from "@/types/appointment.type";

export const AppointmentActionsClient = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  return (
    <div className="flex gap-2 pt-2">
      <Button size="sm" variant="outline">
        <Pencil className="w-4 h-4 mr-1" />
        Editar
      </Button>

      <Button size="sm" variant="destructive">
        <Trash className="w-4 h-4 mr-1" />
        Cancelar
      </Button>
    </div>
  );
};
