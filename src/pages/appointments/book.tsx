import { useParams } from "react-router-dom";
import { BookingForm } from "@/components/booking/BookingForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
export function BookAppointment() {
  const { id } = useParams();
  const shop = useGetBarberShop(id);
  if (shop.isLoading) return <p>Carregando barbearia…</p>;
  if (!shop.data) return <p role="alert">Erro ao carregar barbearia.</p>;
  return (
    <section className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Agendar em {shop.data.name}</h1>
      <p>{shop.data.address}</p>
      <BookingForm shopId={shop.data.id} />
    </section>
  );
}
