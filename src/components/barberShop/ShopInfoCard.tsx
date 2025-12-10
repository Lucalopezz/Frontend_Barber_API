import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BarberShop } from "@/types/barberShop.type";
import { MapPin, User, Calendar } from "lucide-react";

export const ShopInfoCard = ({ shop }: { shop: BarberShop }) => {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Informações da Barbearia</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-gray-700">
        <p className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>
            <strong>Nome:</strong> {shop.name}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>
            <strong>Endereço:</strong> {shop.address}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            <strong>Criada em:</strong>{" "}
            {new Date(shop.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </p>
      </CardContent>
    </Card>
  );
};
