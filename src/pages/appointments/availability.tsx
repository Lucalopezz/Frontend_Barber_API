import { AvailabilityManager } from "@/components/booking/AvailabilityManager";
import { useGetUser } from "@/hooks/queries/user/useGetUser";

export const AvailabilityPage = () => {
  const user = useGetUser();
  if (user.isLoading)
    return (
      <p className="page-section" role="status">
        Carregando expediente…
      </p>
    );
  if (!user.data)
    return (
      <p className="page-section" role="alert">
        Não foi possível carregar sua conta.
      </p>
    );
  if (!user.data.barberShop || !["owner", "barber"].includes(user.data.role))
    return (
      <p className="page-section" role="alert">
        Vincule sua conta a uma barbearia para definir o expediente.
      </p>
    );
  return (
    <section className="page-section mx-auto max-w-4xl space-y-8">
      <header className="border-b pb-6">
        <h1 className="page-title">Meu expediente</h1>
        <p className="mt-3 text-muted-foreground">
          Horários de atendimento e folgas em {user.data.barberShop.name}.
        </p>
      </header>
      <AvailabilityManager />
    </section>
  );
};
