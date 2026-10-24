import { useGetUser } from "@/hooks/queries/user/useGetUser";
import { ShopDangerZone } from "@/components/barberShop/ShopDangerZone";
import { ShopServices } from "@/components/barberShop/ShopServices";
import { ShopUpdateForm } from "@/components/barberShop/ShopUpdateForm";
import { ShopTeam } from "@/components/barberShop/ShopTeam";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
import { Link, NavLink, useParams } from "react-router-dom";

export type ShopSection = "details" | "services" | "team";

export const ShopManagementPage = ({
  section = "details",
}: {
  section?: ShopSection;
}) => {
  const { id } = useParams();
  const user = useGetUser();
  const { data, isLoading, error, refetch } = useGetBarberShop(id);
  if (isLoading || user.isLoading)
    return (
      <p className="page-section" role="status">
        Carregando barbearia…
      </p>
    );
  if (!data || !user.data)
    return (
      <p className="page-section" role="alert">
        Não foi possível carregar a barbearia.{" "}
        <button
          className="underline"
          onClick={() => {
            void refetch();
            void user.refetch();
          }}
        >
          Tentar novamente
        </button>
      </p>
    );
  if (
    user.data.barberShop?.id !== id ||
    user.data.barberShop?.relationship !== "owner"
  )
    return (
      <p className="page-section" role="alert">
        Você não pode gerenciar esta barbearia.
      </p>
    );

  const base = `/barber-shop/${data.id}`;
  return (
    <div className="page-section mx-auto max-w-5xl space-y-8">
      <header className="space-y-3 border-b pb-6">
        <Link
          to="/"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Voltar à visão geral
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Sua barbearia</h1>
            <p className="mt-2 text-lg font-semibold">{data.name}</p>
          </div>
          <p className="max-w-sm break-words text-sm text-muted-foreground">
            {data.address}
          </p>
        </div>
      </header>
      {(error || user.error) && (
        <p role="alert">
          Os dados podem estar desatualizados.{" "}
          <button
            className="underline"
            onClick={() => {
              void refetch();
              void user.refetch();
            }}
          >
            Atualizar
          </button>
        </p>
      )}
      <nav aria-label="Gestão da barbearia" className="shop-tabs">
        <NavLink to={base} end>
          Dados
        </NavLink>
        <NavLink to={`${base}/services`}>Serviços</NavLink>
        <NavLink to={`${base}/team`}>Equipe</NavLink>
      </nav>
      {section === "details" && (
        <div className="space-y-8">
          <section aria-labelledby="shop-data-title" className="space-y-4">
            <div>
              <h2 id="shop-data-title" className="section-title">
                Dados da barbearia
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nome e endereço exibidos para os clientes.
              </p>
            </div>
            <ShopUpdateForm shop={data} />
          </section>
          <details className="rounded-xl border border-border bg-white p-5 text-sm">
            <summary className="font-semibold">Excluir barbearia</summary>
            <div className="mt-5">
              <ShopDangerZone shop={data} />
            </div>
          </details>
        </div>
      )}
      {section === "services" && <ShopServices barberShopId={data.id} />}
      {section === "team" && <ShopTeam shopId={data.id} />}
    </div>
  );
};
