import { Calendar, Clock } from "lucide-react";
import type { Appointment } from "@/types/appointment.type";
import type { Role } from "@/types/user.type";
import { AppointmentActionsClient } from "./AppointmentActionsClient";
import { AppointmentActionsBarber } from "./AppointmentActionsBarber";

export const AppointmentCard = ({
  appointment,
  role,
}: {
  appointment: Appointment;
  role?: Role;
}) => {
  const date = new Date(appointment.date);

  return (
    <div className="border rounded-xl p-4 bg-white space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="flex items-center gap-2 font-medium">
            <Calendar size={16} />
            {date.toLocaleDateString("pt-BR")}
          </p>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            {date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <span className="text-xs px-2 py-1 rounded bg-muted">
          {appointment.status}
        </span>
      </div>

      {role === "client" && (
        <AppointmentActionsClient appointment={appointment} />
      )}

      {role === "barber" && (
        <AppointmentActionsBarber appointment={appointment} />
      )}
    </div>
  );
};
