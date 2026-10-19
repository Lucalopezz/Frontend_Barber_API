import { Skeleton } from "@/components/ui/skeleton";
import { useListServices } from "@/hooks/queries/services/useListServices";
import type { Service } from "@/types/services.type";
import { CreateServiceForm } from "../services/CreateServiceForm";
import { ServiceList } from "../services/ServiceList";

export const ShopServices = ({ barberShopId }: { barberShopId: string }) => {
  const { data, isLoading, isError, refetch } = useListServices(barberShopId);

  const services: Service[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="section-title">Serviços</h2>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] items-start">
        <CreateServiceForm />

        <section>
          <h2 className="text-lg font-medium mb-4">Lista de serviços</h2>

          {isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {data
                ? "Não foi possível atualizar os serviços. Os dados exibidos podem estar desatualizados."
                : "Não foi possível carregar os serviços."}{" "}
              <button className="underline" onClick={() => void refetch()}>
                Tentar novamente
              </button>
            </p>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : data ? (
            <ServiceList services={services} />
          ) : null}
        </section>
      </div>
    </div>
  );
};
