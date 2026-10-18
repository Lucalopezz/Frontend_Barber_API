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
  const { data, isLoading, error } = useGetBarberShop(id);
  if (isLoading)
    return (
      <p className="page-section" role="status">
        Carregando barbearia…
      </p>
    );
  if (error || !data)
    return (
      <p className="page-section" role="alert">
        Erro ao carregar barbearia.
      </p>
    );
  if (user.isLoading)
    return <p className="page-section">Carregando usuário…</p>;
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
