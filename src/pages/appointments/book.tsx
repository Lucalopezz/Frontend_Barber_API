import { Link, useParams } from "react-router-dom";
import { BookingForm } from "@/components/booking/BookingForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
export function BookAppointment() {
  const { id } = useParams();
  const shop = useGetBarberShop(id);
  if (shop.isLoading) return <p>Carregando barbearia…</p>;
  if (!shop.data) return <p role="alert">Erro ao carregar barbearia.</p>;
  return (
    <section className="page-section max-w-3xl mx-auto space-y-5">
      <Link
        to="/"
        className="inline-block text-sm underline text-muted-foreground"
      >
        Voltar às barbearias
      </Link>
      <h1 className="page-title">Agendar em {shop.data.name}</h1>
      <p className="text-muted-foreground break-words">{shop.data.address}</p>
      <BookingForm shopId={shop.data.id} />
    </section>
  );
}
