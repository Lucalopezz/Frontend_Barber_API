import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Scissors } from "lucide-react";
import { useListBarberShops } from "@/hooks/queries/barberShops/useListBarbershops";
import { BarberIllustration } from "@/components/layout/BarberIllustration";

export const HomeClient = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useListBarberShops({
    page,
    perPage: 20,
    filter: search || undefined,
  });
  return (
    <div className="space-y-10">
      <header className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div className="py-2 md:py-6">
          <h1 className="display-title max-w-xl">
            Seu corte.
            <br />
            No seu tempo.
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            Encontre sua barbearia e escolha o melhor horário para você.
          </p>
          <div className="relative mt-7 max-w-lg">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-4 size-5 text-muted-foreground"
            />
            <Input
              aria-label="Buscar barbearia"
              placeholder="Qual barbearia você procura?"
              className="h-14 rounded-xl pl-12 pr-4 shadow-none"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="relative hidden overflow-hidden rounded-[24px] bg-primary p-4 md:block">
          <BarberIllustration className="w-full" />
        </div>
      </header>
      <section aria-labelledby="catalog-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-4">
          <h2 id="catalog-title" className="section-title">
            {search ? "Resultado da busca" : "Encontre uma Barbearia"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Escolha o lugar. O próximo passo é o horário.
          </p>
        </div>
        {isError && (
          <p role="alert">
            Não foi possível carregar as barbearias.{" "}
            <button className="underline" onClick={() => refetch()}>
              Tentar novamente
            </button>
          </p>
        )}
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        )}
        {!isLoading && data?.data.length === 0 && (
          <div className="panel py-12 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto mb-3 text-muted-foreground"
            />
            <h3 className="font-semibold">Nenhuma barbearia encontrada.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "Tente outro nome ou limpe a busca."
                : "As barbearias aparecerão aqui assim que forem cadastradas."}
            </p>
          </div>
        )}
        {!isLoading && data && data.data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((shop) => (
              <article
                key={shop.id}
                className="flex min-w-0 flex-col rounded-xl border bg-white p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Scissors aria-hidden="true" size={22} />
                  </span>
                  <h3 className="min-w-0 break-words text-lg font-bold">
                    {shop.name}
                  </h3>
                </div>
                <p className="mb-6 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="break-words">{shop.address}</span>
                </p>
                <Button
                  className="mt-auto w-full"
                  onClick={() => navigate(`/book/${shop.id}`)}
                >
                  Agendar
                </Button>
              </article>
            ))}
          </div>
        )}
        {data && data.meta.lastPage > 1 && (
          <nav
            aria-label="Páginas de barbearias"
            className="flex flex-wrap items-center justify-center gap-3 pt-4"
          >
            <Button
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {data.meta.lastPage}
            </span>
            <Button
              variant="outline"
              disabled={page >= data.meta.lastPage || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
};
