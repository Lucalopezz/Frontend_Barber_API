import { UpdateUserForm } from "@/components/user/updateUserForm";
import { UserInfo } from "@/components/user/userInfo";
import { useGetUser } from "@/hooks/queries/useGetUser";
export const Profile = () => {
  const { data, isLoading, error } = useGetUser();

  return (
    <section className="container mx-auto px-4 pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <UserInfo data={data} isLoading={isLoading} error={error} />
          <p>editar senha</p>
        </div>

        <div className="lg:col-span-1">
          <UpdateUserForm user={data} />
        </div>

        {/* Ainda indefinido */}
        <div className="lg:col-span-1">
          <p>lista de agendamentos</p>
        </div>
      </div>
    </section>
  );
};
