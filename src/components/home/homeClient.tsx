import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useListBarberShops } from "@/hooks/queries/barberShops/useListBarbershops";

export const HomeClient = () => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListBarberShops({
    page: 1,
    perPage: 20,
    filter: search.length > 0 ? search : undefined,
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Encontre uma Barbearia</h1>
        <p className="text-muted-foreground">
          Pesquise e agende um horário de forma rápida.
        </p>
      </header>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da barbearia..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          Nenhuma barbearia encontrada.
        </div>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.data.map((shop) => (
            <Card
              key={shop.id}
              className="rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <CardHeader>
                <CardTitle className="text-lg">{shop.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{shop.address}</p>

                <Button className="w-full" variant="default">
                  Agendar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
