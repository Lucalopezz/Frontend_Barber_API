import { useState } from "react";
import { Bell, CalendarDays, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useListNotifications } from "@/hooks/queries/notifications/useListNotifications";

export function Notifications() {
  const [page, setPage] = useState(1);
  const query = useListNotifications(page);
  const { data, isPending, isFetching, isError } = query;
  return (
    <section className="page-section mx-auto max-w-3xl space-y-6" aria-labelledby="notifications-heading" aria-busy={isFetching}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="notifications-heading" className="page-title">Notificações</h1>
          <p className="mt-2 text-muted-foreground">As confirmações dos seus agendamentos ficam aqui.</p>
        </div>
        <Button variant="outline" disabled={isFetching} onClick={() => void query.refetch()}>
          <RefreshCw size={16} aria-hidden="true" /> Atualizar
        </Button>
      </div>
      {isPending && <p role="status">Carregando notificações…</p>}
      {isError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-white p-5 space-y-3">
          <p>{data ? "Não foi possível atualizar as notificações. Mostrando a última consulta." : "Não foi possível carregar suas notificações."}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void query.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {data?.data.length === 0 && !isError && (
        <div className="rounded-xl border bg-white px-6 py-12 text-center">
          <Bell className="mx-auto mb-4 text-muted-foreground" size={28} aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Nenhuma notificação por enquanto</h2>
          <p className="mt-2 text-muted-foreground">Quando um agendamento for confirmado, o aviso aparecerá aqui.</p>
        </div>
      )}
      {data && data.data.length > 0 && (
        <ul aria-label="Confirmações de agendamento" className="divide-y rounded-xl border bg-white">
          {data.data.map((notification) => (
            <li key={notification.id} className="p-5 sm:p-6 space-y-2 break-words">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays size={18} aria-hidden="true" />
                <h2 className="text-xl font-semibold">Agendamento confirmado</h2>
              </div>
              <p className="font-medium">{notification.serviceName} em {notification.barberShopName}</p>
              <p>
                <time dateTime={notification.startsAt}>
                  {new Intl.DateTimeFormat("pt-BR", { timeZone: notification.timezone, dateStyle: "short", timeStyle: "short" }).format(new Date(notification.startsAt))}
                </time>
                <span className="block text-sm text-muted-foreground">Horário da barbearia</span>
              </p>
              <Button asChild variant="link" className="h-auto px-0 py-2">
                <Link to="/appointments">Ver na agenda</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
      {data && data.meta.lastPage > 1 && (
        <nav aria-label="Páginas de notificações" className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
          <span>Página {page} de {data.meta.lastPage}</span>
          <Button variant="outline" disabled={page >= data.meta.lastPage || isFetching} onClick={() => setPage((value) => value + 1)}>Próxima</Button>
        </nav>
      )}
    </section>
  );
}
