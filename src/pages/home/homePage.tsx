import { HomeBarber } from "@/components/home/homeBarber";
import { HomeClient } from "@/components/home/homeClient";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
export const HomePage = () => {
  const { data: userData, isLoading, isError, refetch } = useGetUser(false);
  return (
    <section className="page-section">
      {isLoading && <p role="status">Preparando seu espaço…</p>}
      {isError && (
        <p role="alert">
          Não foi possível carregar sua conta.{" "}
          <button className="underline" onClick={() => refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {userData?.role === "client" && <HomeClient />}
      {(userData?.role === "barber" || userData?.role === "owner") && (
        <HomeBarber user={userData} />
      )}
    </section>
  );
};
