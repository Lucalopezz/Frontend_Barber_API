import { Link, useParams } from "react-router-dom";
import { BookingForm } from "@/components/booking/BookingForm";
import { useGetBarberShop } from "@/hooks/queries/barberShops/useGetBarberShop";
export function BookAppointment() {
  const { id } = useParams();
  const shop = useGetBarberShop(id);
  if (shop.isLoading) return <p>Carregando barbearia…</p>;
  if (!shop.data) return (
    <p role="alert">
      Erro ao carregar barbearia. {" "}
      <button className="underline" onClick={() => void shop.refetch()}>Tentar novamente</button>
    </p>
  );
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
      {shop.isError && (
        <p role="alert">
          Não foi possível atualizar os dados desta barbearia. Os dados exibidos podem estar desatualizados. {" "}
          <button className="underline" onClick={() => void shop.refetch()}>Tentar novamente</button>
        </p>
      )}
      <BookingForm shopId={shop.data.id} />
    </section>
  );
}
