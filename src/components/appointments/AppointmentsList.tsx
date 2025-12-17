import type { Appointment } from "@/types/appointment.type";
import type { User } from "@/types/user.type";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";


interface Props {
  user?: User;
  data?: { data: Appointment[] };
  isLoading: boolean;
  error: unknown;
}

export const AppointmentsList = ({ user, data, isLoading, error }: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">Erro ao carregar agendamentos.</p>
    );
  }

  const appointments = data?.data ?? [];

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum agendamento encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          role={user?.role}
        />
      ))}
    </div>
  );
};
