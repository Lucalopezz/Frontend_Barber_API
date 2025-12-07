import { UserInfo } from "@/components/user/userInfo";
import { useGetUser } from "@/hooks/queries/useGetUser";
export const Profile = () => {
  const { data, isLoading, error } = useGetUser();

  return (
    <section className="container mx-auto px-4 pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <UserInfo data={data} isLoading={isLoading} error={error} />
          <p>form de edit</p>
        </div>

        <div className="lg:col-span-1">
          <p>lista de agendamentos</p>
        </div>

        {/* Ainda indefinido */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Em breve...</h2>
            <p className="text-gray-600">Conteúdo a definir</p>
          </div>
        </div>
      </div>
    </section>
  );
};
