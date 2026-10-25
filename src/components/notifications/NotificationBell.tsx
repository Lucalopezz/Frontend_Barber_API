import { useId } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUnreadNotificationsCount } from "@/hooks/queries/notifications/useUnreadNotificationsCount";

export function NotificationBell() {
  const { data: count, isError } = useUnreadNotificationsCount();
  const descriptionId = useId();
  const description = count === undefined
    ? isError ? "Contagem de notificações indisponível." : "Carregando contagem de notificações."
    : `${isError ? "Última contagem: " : ""}${count} ${count === 1 ? "notificação não lida" : "notificações não lidas"}.${isError ? " Não foi possível atualizar." : ""}`;
  return (
    <Button asChild variant="ghost" size="icon" className="relative size-11">
      <Link to="/notifications" aria-label="Notificações" aria-describedby={descriptionId} title={description}>
        <Bell size={20} aria-hidden="true" />
        {count !== undefined && count > 0 && (
          <span aria-hidden="true" className="absolute right-0 top-0 min-w-5 rounded-full bg-[#883d43] px-1 text-center text-xs font-semibold leading-5 text-white">{count > 99 ? "99+" : count}</span>
        )}
        <span id={descriptionId} className="sr-only">{description}</span>
      </Link>
    </Button>
  );
}
