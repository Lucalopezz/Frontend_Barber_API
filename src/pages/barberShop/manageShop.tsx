import { AvailabilityManager } from "@/components/booking/AvailabilityManager";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
import { ShopDangerZone } from "@/components/barberShop/ShopDangerZone";
import { ShopServices } from "@/components/barberShop/ShopServices";
import { ShopUpdateForm } from "@/components/barberShop/ShopUpdateForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
import { Link, useParams } from "react-router-dom";
export const ShopManagementPage = () => {
  const { id } = useParams();
  const user = useGetUser();
  const { data, isLoading, error, refetch } = useGetBarberShop(id);
  if (isLoading)
    return (
      <p className="page-section" role="status">
        Carregando barbearia…
      </p>
    );
  if (!data)
    return (
      <p className="page-section" role="alert">
        Erro ao carregar barbearia. {" "}
        <button className="underline" onClick={() => void refetch()}>Tentar novamente</button>
      </p>
    );
  if (user.isLoading)
    return <p className="page-section">Carregando usuário…</p>;
  if (!user.data)
    return (
      <p className="page-section" role="alert">
        Não foi possível confirmar o contexto da conta. {" "}
        <button className="underline" onClick={() => void user.refetch()}>Tentar novamente</button>
      </p>
    );
  if (
    user.data?.barberShop?.id !== id ||
    user.data?.barberShop?.relationship !== "owner"
  )
    return <p role="alert">Você não pode gerenciar esta barbearia.</p>;
  return (
    <div className="page-section space-y-8">
      <header>
        <Link
          to="/"
          className="mb-4 inline-block text-sm text-muted-foreground underline"
        >
          Voltar ao início
        </Link>
        <h1 className="page-title">Gerenciar Barbearia</h1>
        <p className="mt-3 text-lg font-semibold">{data.name}</p>
        <p className="text-sm text-muted-foreground break-words">
          {data.address}
        </p>
      </header>
      {error && (
        <p role="alert">
          Não foi possível atualizar os dados desta barbearia. Os dados exibidos podem estar desatualizados. {" "}
          <button className="underline" onClick={() => void refetch()}>Tentar novamente</button>
        </p>
      )}
      {user.error && (
        <p role="alert">
          Não foi possível atualizar o contexto da conta. As permissões exibidas podem estar desatualizadas. {" "}
          <button className="underline" onClick={() => void user.refetch()}>Tentar novamente</button>
        </p>
      )}
      <nav
        aria-label="Seções da barbearia"
        className="flex flex-wrap gap-2 border-y py-3"
      >
        <a className="site-nav-link" href="#shop-details">
          Dados da barbearia
        </a>
        <a className="site-nav-link" href="#shop-services">
          Serviços
        </a>
        <a className="site-nav-link" href="#shop-hours">
          Expediente e folgas
        </a>
      </nav>
      <div id="shop-details">
        <ShopUpdateForm shop={data} />
      </div>
      <div id="shop-services">
        <ShopServices barberShopId={data.id} />
      </div>
      <div id="shop-hours">
        <AvailabilityManager />
      </div>
      <ShopDangerZone shop={data} />
    </div>
  );
};
