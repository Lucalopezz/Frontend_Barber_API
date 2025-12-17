import { Skeleton } from "@/components/ui/skeleton";
import { useListServices } from "@/hooks/queries/services/useListServices";
import type { Service } from "@/types/services.type";
import { CreateServiceForm } from "../services/CreateServiceForm";
import { ServiceList } from "../services/ServiceList";

export const ShopServices = () => {
  const { data, isLoading } = useListServices();

  const services: Service[] = data?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Serviços</h1>

      <CreateServiceForm />

      <section>
        <h2 className="text-lg font-medium mt-4 mb-3">Lista de serviços</h2>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : (
          <ServiceList services={services} />
        )}
      </section>
    </div>
  );
};
