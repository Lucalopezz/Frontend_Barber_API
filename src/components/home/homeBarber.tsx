import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { useListAppointments } from "@/hooks/queries/appointments/useListAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Building2, Scissors } from "lucide-react";
import type { User } from "@/types/user.type";
import { useListBarberShops } from "@/hooks/queries/barberShops/useListBarbershops";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import type { CreateAndUpdateBarberShopType } from "../barberShop/ShopUpdateForm";
import { CreateBarberShopDialog } from "./createShopDialog";

export const HomeBarber = ({ user }: { user: User }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddShop = (shop: CreateAndUpdateBarberShopType) => {
    console.log(shop);

    setIsDialogOpen(false);
  };

  const navigate = useNavigate();
  const { data: shopsData, isLoading: shopsLoading } = useListBarberShops({
    perPage: 9999,
  });
  const { data: apptData, isLoading: apptLoading } = useListAppointments({
    perPage: 7,
    sort: "date",
    sortDir: "asc",
  });

  const shops = shopsData?.data ?? [];

  const appointmentsData = apptData?.data ?? [];

  const appointments = appointmentsData.filter((appointment) => {
    const dateObj = new Date(appointment.date);
    const today = new Date();
    return dateObj >= today;
  });

  const myShop = shops.find((shop) => shop.ownerId === user?.id);

  if (shopsLoading || apptLoading) {
    return (
      <div className="space-y-6 mt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard do Barbeiro</h1>

      {myShop ? (
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} />
              Sua Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-lg">{myShop.name}</p>
            <p className="text-gray-600">{myShop.address}</p>

            <Button
              className="mt-4"
              onClick={() => navigate(`/barber-shop/${myShop.id}`)}
            >
              Gerenciar Barbearia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white p-4 shadow-sm">
          <p className="text-gray-700 mb-3">
            Você ainda não possui uma barbearia cadastrada.
          </p>
          <CreateBarberShopDialog
            open={isDialogOpen}
            loading={false}
            onSubmit={handleAddShop}
            onOpenChange={setIsDialogOpen}
          />
        </Card>
      )}

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays size={20} />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {appointments.length === 0 && (
            <p className="text-gray-600 text-sm">
              Nenhum agendamento futuro encontrado.
            </p>
          )}

          {appointments.map((appt) => {
            const d = new Date(appt.date);
            const dateStr = d.toLocaleDateString("pt-BR");
            const timeStr = d.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={appt.id}
                className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{dateStr}</p>
                  <p className="text-sm text-gray-600">{timeStr}</p>
                </div>

                <span className="text-sm px-2 py-1 bg-blue-100 rounded-md">
                  {appt.status}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors size={20} />
            Resumo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">{appointments.length}</p>
            <p className="text-gray-600 text-sm">Agendamentos Futuros</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{appointmentsData.length}</p>
            <p className="text-gray-600 text-sm">Todos os Agendamentos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
