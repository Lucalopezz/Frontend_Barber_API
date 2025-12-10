import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { BarberShop } from "@/types/barberShop.type";
import { useDeleteBarberShop } from "@/hooks/queries/barberShops/useDeleteBarberShop";

export const ShopDangerZone = ({ shop }: { shop: BarberShop }) => {
  const deleteMutation = useDeleteBarberShop(shop.id);

  return (
    <Card className="border-red-300 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl text-red-600">Zona de Perigo</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Excluir a barbearia removerá todos os dados permanentemente, incluindo
          informações de clientes, agendamentos e serviços e{" "}
          <strong>O PERFIL DO DONO</strong>.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Excluir Barbearia
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja excluir?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>

              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
