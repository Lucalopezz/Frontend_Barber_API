import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppointmentsHeader } from "@/components/appointments/AppointmentsHeader";
import { AppointmentsList } from "@/components/appointments/AppointmentsList";
import { useListAppointments } from "@/hooks/queries/appointments/useListAppointments";
import { useGetUser } from "@/hooks/queries/user/useGetUser";

export const Appointments = () => {
  const [page, setPage] = useState(1);
  const { data: user } = useGetUser();

  const { data, isLoading, error } = useListAppointments({
    page,
    sort: "date",
    sortDir: "asc",
    perPage: 50,
  });

  return (
    <div className="page-section max-w-5xl mx-auto space-y-8">
      <AppointmentsHeader role={user?.role} />

      <AppointmentsList
        user={user}
        data={data}
        isLoading={isLoading}
        error={error}
      />
      {data && data.meta.lastPage > 1 && (
        <nav
          aria-label="Páginas de agendamentos"
          className="flex flex-wrap gap-3 items-center"
        >
          <Button
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {page} de {data.meta.lastPage}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.meta.lastPage || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </nav>
      )}
    </div>
  );
};
