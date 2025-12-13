import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import {
  BarberShopSchema,
  type CreateAndUpdateBarberShopType,
} from "../barberShop/ShopUpdateForm";

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (barberShop: CreateAndUpdateBarberShopType) => void;
  loading: boolean;
};

export const CreateBarberShopDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: TransactionDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof BarberShopSchema>>({
    resolver: zodResolver(BarberShopSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const handleFormSubmit = (data: CreateAndUpdateBarberShopType) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Criar Loja</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-700">
            Criar nova baerbearia
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-700">
              Nome
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                type="text"
                {...register("name")}
                placeholder="Nome da loja"
                className={cn(
                  "border-none text-gray-700 placeholder-gray-400",
                  errors.name && "border-red-500",
                )}
              />
              {errors && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name?.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right text-gray-700">
              Endereço
            </Label>
            <div className="col-span-3">
              <Input
                id="address"
                type="text"
                {...register("address")}
                placeholder="Rua, número, cidade – estado"
                className={cn(
                  "border-none text-gray-700 placeholder-gray-400",
                  errors.address && "border-red-500",
                )}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-[#364152] border-none text-white hover:bg-[#4A5567]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Carrgando" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
