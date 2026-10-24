import { UpdateUserForm } from "@/components/user/updateUserForm";
import { UpdateUserPasswordForm } from "@/components/user/updateUserPassword";
import { UserInfo } from "@/components/user/userInfo";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
import { Link } from "react-router-dom";
export const Profile = () => {
  const { data, isLoading, error, refetch } = useGetUser();

  return (
    <section className="page-section mx-auto max-w-4xl space-y-8">
      <header className="border-b pb-6">
        <h1 className="page-title">Minha conta</h1>
        <p className="mt-3 text-muted-foreground">Dados de acesso e informações do seu perfil.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="space-y-6">
          <UserInfo data={data} isLoading={isLoading} error={error} onRetry={() => { void refetch(); }} />
          <UpdateUserForm user={data} />
        </div>
        <UpdateUserPasswordForm user={data} />
      </div>
      <p className="text-sm text-muted-foreground">Procurando seus horários? <Link className="font-semibold text-foreground underline underline-offset-4" to="/appointments">Abra sua agenda</Link>.</p>
    </section>
  );
};
