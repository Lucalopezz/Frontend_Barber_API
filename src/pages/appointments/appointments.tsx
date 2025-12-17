import { AppointmentsHeader } from "@/components/appointments/AppointmentsHeader";
import { AppointmentsList } from "@/components/appointments/AppointmentsList";
import { useListAppointments } from "@/hooks/queries/appointments/useListAppointments";
import { useGetUser } from "@/hooks/queries/user/useGetUser";

export const Appointments = () => {
  const { data: user } = useGetUser();

  const { data, isLoading, error } = useListAppointments({
    sort: "date",
    sortDir: "asc",
    perPage: 50,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <AppointmentsHeader role={user?.role} />

      <AppointmentsList
        user={user}
        data={data}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
