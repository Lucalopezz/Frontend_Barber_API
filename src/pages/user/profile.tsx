import { ListUserAppointments } from "@/components/appointments/listUserAppointments";
import { UpdateUserForm } from "@/components/user/updateUserForm";
import { UpdateUserPasswordForm } from "@/components/user/updateUserPassword";
import { UserInfo } from "@/components/user/userInfo";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
export const Profile = () => {
  const { data, isLoading, error } = useGetUser();

  return (
    <section className="container mx-auto px-4 pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <UserInfo data={data} isLoading={isLoading} error={error} />
          <UpdateUserPasswordForm user={data} />
        </div>

        <div className="lg:col-span-1">
          <UpdateUserForm user={data} />
        </div>

        {/* If user is a barber, show barber appoinments */}
        {/* If user is a client, show client appoinments */}
        <div className="lg:col-span-1">
          <ListUserAppointments user={data} />
        </div>
      </div>
    </section>
  );
};
