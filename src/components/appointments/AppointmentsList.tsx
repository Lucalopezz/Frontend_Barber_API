import type { Appointment } from "@/types/appointment.type";
import type { User } from "@/types/user.type";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";


interface Props {
  user?: User;
  data?: { data: Appointment[] };
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

export const AppointmentsList = ({ user, data, isLoading, isFetching, error, onRetry }: Props) => {
  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Erro ao carregar agendamentos. {" "}
        <button type="button" disabled={isFetching} onClick={onRetry}>
          Tentar novamente
        </button>
      </p>
    );
  }

  const appointments = data?.data ?? [];

  if (!error && appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum agendamento encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Boolean(error) && (
        <p role="alert" className="text-sm text-red-600">
          Não foi possível atualizar os agendamentos. Os dados exibidos podem estar desatualizados.{" "}
          <button type="button" disabled={isFetching} onClick={onRetry}>
            Tentar novamente
          </button>
        </p>
      )}
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} role={user?.role} />
      ))}
    </div>
  );
};
