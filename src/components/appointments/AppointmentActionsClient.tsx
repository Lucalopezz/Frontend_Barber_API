import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import type { Appointment } from "@/types/appointment.type";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useCancelAppointment } from "@/hooks/queries/appointments/useCancelAppointment";

export const AppointmentActionsClient = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const deleteMutation = useCancelAppointment(appointment.id);
  return (
    <div className="flex gap-2 pt-2">
      <Button size="sm" variant="outline">
        <Pencil className="w-4 h-4 mr-1" />
        Editar
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex items-center gap-2">
            <Trash className="h-4 w-4" />
            Cancelar
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja cancelar o agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Não cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Calcelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
