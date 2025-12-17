import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceEditDialog } from "./ServiceEditDialog";
import { ServiceDeleteAlert } from "./ServiceDeleteAlert";
import type { Service } from "@/types/services.type";

export const ServiceList = ({ services }: { services: Service[] }) => {
  if (!services || services.length === 0) {
    return <p className="text-sm text-gray-600">Nenhum serviço cadastrado.</p>;
  }

  return (
    <div className="grid gap-3">
      {services.map((s) => (
        <Card key={s.id} className="p-3">
          <CardHeader className="flex justify-between items-start gap-3">
            <div>
              <CardTitle className="text-lg">{s.name}</CardTitle>
              <p className="text-sm text-gray-600">{s.description ?? ""}</p>
              <p className="text-sm text-gray-700 mt-2">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(s.price)}{" "}
                • {s.duration} min
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <ServiceEditDialog service={s} />
              <ServiceDeleteAlert service={s} />
            </div>
          </CardHeader>

          <CardContent />
        </Card>
      ))}
    </div>
  );
};
