import { ShopDangerZone } from "@/components/barberShop/ShopDangerZone";
import { ShopInfoCard } from "@/components/barberShop/ShopInfoCard";
import { ShopUpdateForm } from "@/components/barberShop/ShopUpdateForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
import { useParams } from "react-router-dom";

export const ShopManagementPage = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useGetBarberShop(id);

  if (isLoading) return <p>Carregando...</p>;
  if (error || !data) return <p>Erro ao carregar barbearia.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Gerenciar Barbearia</h1>

      <ShopInfoCard shop={data} />

      <ShopUpdateForm shop={data} />

      <ShopDangerZone shop={data} />
    </div>
  );
};
