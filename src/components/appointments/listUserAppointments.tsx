import type { User } from "@/types/user.type";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, UserCircle2 } from "lucide-react";
import { useListAppointments } from "@/hooks/queries/appointments/useListAppointments";

export const ListUserAppointments = ({ user }: { user: User | undefined }) => {
  // o backend já filtra pela role do usuário
  const { data, isLoading, error } = useListAppointments({
    perPage: 7,
    sort: "date",
    sortDir: "asc",
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-6 w-40" />
        <div className="border rounded-lg p-4 space-y-3 bg-white">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        <div className="border rounded-lg p-4 space-y-3 bg-white">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-sm mt-4">
        Erro ao carregar agendamentos.
      </p>
    );
  }

  const appointmentsData = data?.data ?? [];

  const appointments = appointmentsData.filter((appointment) => {
    const dateObj = new Date(appointment.date);
    const today = new Date();
    return dateObj >= today;
  });

  return (
    <div className="  bg-slate-50 shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Seus Agendamentos</h2>

      {appointments.length === 0 && (
        <p className="text-gray-600 text-sm">
          Nenhum agendamento encontrado a partir de hoje.
        </p>
      )}

      <div
        className="
               space-y-4
               max-h-[900px]
               overflow-y-auto
               pr-2
               scrollbar-thin
               scrollbar-track-transparent
               scrollbar-thumb-gray-300
               hover:scrollbar-thumb-gray-400
             "
      >
        {appointments.map((appt) => {
          const dateObj = new Date(appt.date);
          const dateStr = dateObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          const timeStr = dateObj.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={appt.id}
              className="border bg-white rounded-lg p-4 shadow-sm"
            >
              <p className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Calendar size={18} />
                {dateStr}
              </p>

              <p className="text-gray-700 flex items-center gap-2">
                <Clock size={16} />
                Horário: {timeStr}
              </p>

              <p className="text-gray-700 flex items-center gap-2 mt-1">
                <UserCircle2 size={16} />
                {user?.role === "barber"
                  ? "Atendimento da barbearia"
                  : "Seu agendamento"}
              </p>

              <p
                className="text-sm mt-3 p-1.5 rounded-md inline-block"
                style={{
                  backgroundColor:
                    appt.status === "scheduled"
                      ? "#dbeafe"
                      : appt.status === "completed"
                        ? "#dcfce7"
                        : "#fee2e2",
                }}
              >
                Status: {appt.status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
