import { appointmentStatus } from "@/utils/appointmentStatus";
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
    <div className="border rounded-xl p-5 sm:p-6 bg-white space-y-5 min-w-0">
      <div className="flex flex-wrap gap-3 justify-between items-start">
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

        <span className="status-badge">
          {appointmentStatus(appointment.status)}
        </span>
      </div>

      {role === "client" && appointment.status === "scheduled" && (
        <AppointmentActionsClient appointment={appointment} />
      )}

      {(role === "barber" || role === "owner") &&
        appointment.status === "scheduled" && (
          <AppointmentActionsBarber appointment={appointment} />
        )}
    </div>
  );
};
