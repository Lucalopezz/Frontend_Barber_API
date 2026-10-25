import { useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useListNotifications } from "@/hooks/queries/notifications/useListNotifications";
import { useMarkNotificationRead } from "@/hooks/queries/notifications/useMarkNotificationRead";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { notificationKeys } from "@/hooks/queries/notifications/queryKeys";
import { getSessionSnapshot } from "@/auth/session";

export function Notifications() {
  const [page, setPage] = useState(1);
  const query = useListNotifications(page);
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const refresh = () => {
    const identity = getSessionSnapshot();
    void query.refetch();
    if (identity) void queryClient.invalidateQueries({ queryKey: notificationKeys.unread(identity.sessionId) });
  };
  const { data, isPending, isFetching, isError } = query;
  return (
    <section className="page-section mx-auto max-w-3xl space-y-6" aria-labelledby="notifications-heading" aria-busy={isFetching}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="notifications-heading" className="page-title">Notificações</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe confirmações, alterações e cancelamentos dos seus agendamentos.</p>
        </div>
        <Button variant="outline" disabled={isFetching} onClick={refresh}>
          <RefreshCw size={16} aria-hidden="true" /> Atualizar
        </Button>
      </div>
      {isPending && <p role="status">Carregando notificações…</p>}
      {isError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-white p-5 space-y-3">
          <p>{data ? "Não foi possível atualizar as notificações. Mostrando a última consulta." : "Não foi possível carregar suas notificações."}</p>
          <Button variant="outline" disabled={isFetching} onClick={refresh}>Tentar novamente</Button>
        </div>
      )}
      {data?.data.length === 0 && !isError && (
        <div className="rounded-xl border bg-white px-6 py-12 text-center">
          <Bell className="mx-auto mb-4 text-muted-foreground" size={28} aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Nenhuma notificação por enquanto</h2>
          <p className="mt-2 text-muted-foreground">Quando houver uma confirmação ou mudança nos seus agendamentos, o aviso aparecerá aqui.</p>
        </div>
      )}
      {data && data.data.length > 0 && (
        <ul aria-label="Notificações de agendamento" className="divide-y rounded-xl border bg-white">
          {data.data.map((notification) => (
            <NotificationItem key={notification.id} notification={notification}
              marking={markRead.isPending && markRead.variables === notification.id}
              disabled={markRead.isPending}
              error={markRead.isError && markRead.variables === notification.id}
              onMarkRead={() => markRead.mutate(notification.id)} />
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
