import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useListAppointments } from "@/hooks/queries/appointments/useListAppointments";
import { CalendarDays, MapPin, Scissors } from "lucide-react";
import type { User } from "@/types/user.type";
import { useState } from "react";
import type { CreateAndUpdateBarberShopType } from "../barberShop/ShopUpdateForm";
import { CreateBarberShopDialog } from "./createShopDialog";
import { useCreateBarberShop } from "@/hooks/queries/barberShops/useCreateBarberShop";
import { showToast } from "@/utils/toast";
import { appointmentStatus } from "@/utils/appointmentStatus";
import { MyInvitations } from "@/components/barberShop/MyInvitations";

export const HomeBarber = ({ user }: { user: User }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: createShop, isPending } = useCreateBarberShop();
  const handleAddShop = (shop: CreateAndUpdateBarberShopType) =>
    createShop(shop, {
      onSuccess: () => {
        showToast("Barbearia criada com sucesso!");
        setIsDialogOpen(false);
      },
      onError: () => showToast("Erro ao criar barbearia", "error"),
    });
  const { data, isLoading, isError, refetch } = useListAppointments({
    perPage: 7,
    sort: "date",
    sortDir: "asc",
  });
  const appointments = data?.data ?? [];
  const myShop = user.barberShop;
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-muted-foreground">
            Olá, {user.name.split(" ")[0]}.
          </p>
          <h1 className="page-title">Seu salão, em dia.</h1>
        </div>
        <Button asChild>
          <Link to="/appointments">
            <CalendarDays aria-hidden="true" size={18} />
            Ver agendamentos
          </Link>
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <section className="rounded-2xl bg-primary p-7 text-white sm:p-9">
          <Scissors aria-hidden="true" className="mb-7 size-9 text-[#c3a78a]" />
          {myShop ? (
            <>
              <p className="text-sm text-white/70">Sua barbearia</p>
              <h2 className="mt-2 break-words font-['Barlow_Condensed'] text-4xl font-bold">
                {myShop.name}
              </h2>
              <p className="mt-4 flex items-start gap-2 text-sm text-white/75">
                <MapPin
                  aria-hidden="true"
                  size={17}
                  className="mt-1 shrink-0"
                />
                {myShop.address}
              </p>
              {myShop.relationship === "owner" && (
                <Button asChild variant="secondary" className="mt-8">
                  <Link to={`/barber-shop/${myShop.id}`}>
                    Gerenciar Barbearia
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <h2 className="font-['Barlow_Condensed'] text-4xl font-bold">
                Dê um lugar à sua agenda.
              </h2>
              <p className="mb-7 mt-4 text-sm text-white/75">
                Cadastre sua barbearia para adicionar serviços e receber
                agendamentos.
              </p>
              <CreateBarberShopDialog
                open={isDialogOpen}
                loading={isPending}
                onSubmit={handleAddShop}
                onOpenChange={setIsDialogOpen}
              />
            </>
          )}
        </section>
        <section className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">Na sua agenda</h2>
            <CalendarDays
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </div>
          {isLoading && <p role="status">Carregando atendimentos…</p>}
          {isError && (
            <p role="alert">
              Não foi possível carregar a agenda.{" "}
              <button className="underline" onClick={() => refetch()}>
                Tentar novamente
              </button>
            </p>
          )}
          {!isLoading && !isError && appointments.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">
              Nenhum agendamento encontrado. Os próximos atendimentos aparecerão
              aqui.
            </p>
          )}
          <div className="divide-y">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "medium",
                    }).format(new Date(appt.date))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(appt.date))}
                  </p>
                </div>
                <span className="status-badge">
                  {appointmentStatus(appt.status)}
                </span>
              </div>
            ))}
          </div>
          {(data?.meta.lastPage ?? 1) > 1 && (
            <Link
              to="/appointments"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Ver todos os agendamentos
            </Link>
          )}
        </section>
      </div>
      {!myShop && user.role === "barber" && <MyInvitations />}
      {myShop && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white px-6 py-5">
          <div>
            <h2 className="font-semibold">Seu expediente</h2>
            <p className="text-sm text-muted-foreground">Ajuste os horários em que você atende e cadastre suas folgas.</p>
          </div>
          <Button asChild variant="outline"><Link to="/availability">Gerenciar expediente</Link></Button>
        </section>
      )}
    </div>
  );
};
