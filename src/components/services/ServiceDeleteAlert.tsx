import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteService } from "@/hooks/queries/services/useDeleteService";
import type { Service } from "@/types/services.type";
import { Trash } from "lucide-react";

export const ServiceDeleteAlert = ({ service }: { service: Service }) => {
  const del = useDeleteService(service.id);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Trash className="w-4 h-4" />
          Excluir
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o serviço{" "}
            <strong>{service.name}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => del.mutate()}
            className="bg-red-600 text-white"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
