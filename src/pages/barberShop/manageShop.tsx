import { AvailabilityManager } from "@/components/booking/AvailabilityManager";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
import { ShopDangerZone } from "@/components/barberShop/ShopDangerZone";
import { ShopInfoCard } from "@/components/barberShop/ShopInfoCard";
import { ShopServices } from "@/components/barberShop/ShopServices";
import { ShopUpdateForm } from "@/components/barberShop/ShopUpdateForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
import { useParams } from "react-router-dom";

export const ShopManagementPage = () => {
  const { id } = useParams();
  const user = useGetUser();
  const { data, isLoading, error } = useGetBarberShop(id);

  if (isLoading) return <p>Carregando...</p>;
  if (error || !data) return <p>Erro ao carregar barbearia.</p>;

  if (user.isLoading) return <p>Carregando usuário…</p>;
  if (
    user.data?.barberShop?.id !== id ||
    user.data?.barberShop?.relationship !== "owner"
  )
    return <p role="alert">Você não pode gerenciar esta barbearia.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Gerenciar Barbearia</h1>

      <ShopInfoCard shop={data} />

      <ShopUpdateForm shop={data} />

      <ShopServices barberShopId={data.id} />

      <AvailabilityManager />

      <ShopDangerZone shop={data} />
    </div>
  );
};
