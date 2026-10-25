import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types/notification.type";

const titles: Record<Notification["type"], string> = {
  appointment_created: "Agendamento confirmado",
  appointment_updated: "Agendamento alterado",
  appointment_cancelled: "Agendamento cancelado",
};

function appointmentTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

interface Props {
  notification: Notification;
  marking: boolean;
  disabled: boolean;
  error: boolean;
  onMarkRead: () => void;
}

export function NotificationItem({ notification, marking, disabled, error, onMarkRead }: Props) {
  const previousStartsAt = notification.previousStartsAt;
  const timeChanged = notification.type === "appointment_updated" && previousStartsAt && Date.parse(previousStartsAt) !== Date.parse(notification.startsAt);
  const serviceChanged = notification.type === "appointment_updated" && notification.previousServiceName && notification.previousServiceName !== notification.serviceName;
  return (
    <li className="p-5 sm:p-6 space-y-3 break-words">
      <div className="flex flex-wrap items-center justify-between gap-2 text-primary">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-semibold">{titles[notification.type]}</h2>
        </div>
        <span className={notification.readAt ? "text-sm text-muted-foreground" : "text-sm font-semibold text-[#883d43]"}>{notification.readAt ? "Lida" : "Não lida"}</span>
      </div>
      <p className="font-medium">{notification.serviceName} em {notification.barberShopName}</p>
      {serviceChanged && (
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Serviço anterior</dt><dd>{notification.previousServiceName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Novo serviço</dt><dd>{notification.serviceName}</dd></div>
        </dl>
      )}
      {timeChanged && previousStartsAt ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Horário anterior</dt><dd><time dateTime={previousStartsAt}>{appointmentTime(previousStartsAt, notification.timezone)}</time></dd></div>
          <div><dt className="text-sm text-muted-foreground">Novo horário</dt><dd><time dateTime={notification.startsAt}>{appointmentTime(notification.startsAt, notification.timezone)}</time></dd></div>
        </dl>
      ) : <p><time dateTime={notification.startsAt}>{appointmentTime(notification.startsAt, notification.timezone)}</time></p>}
      <p className="text-sm text-muted-foreground">Horário da barbearia</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="link" className="px-0"><Link to="/appointments">Ver na agenda</Link></Button>
        {!notification.readAt && <Button variant="outline" disabled={disabled} onClick={onMarkRead}>{marking ? "Salvando…" : "Marcar como lida"}</Button>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">Não foi possível marcar a notificação como lida. Tente novamente.</p>}
    </li>
  );
}
