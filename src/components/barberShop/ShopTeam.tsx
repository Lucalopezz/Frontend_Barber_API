import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useShopBarbers,
  useShopInvitations,
  useTeamAction,
} from "@/hooks/queries/barberShops/useShopTeam";
import api from "@/utils/api";

export function ShopTeam({ shopId }: { shopId: string }) {
  const barbers = useShopBarbers(shopId);
  const invitations = useShopInvitations(shopId);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const invite = useTeamAction((recipient: string) =>
    api.post(`/barber-shops/${shopId}/invitations`, { email: recipient }),
  );
  const revoke = useTeamAction((id: string) =>
    api.delete(`/barber-shops/${shopId}/invitations/${id}`),
  );
  const unlink = useTeamAction((id: string) =>
    api.delete(`/barber-shops/${shopId}/barbers/${id}`),
  );

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setMessage("");
    try {
      await invite.mutateAsync(email.trim());
      setEmail("");
      setFailed(false);
      setMessage(
        "Convite enviado. O barbeiro precisa aceitar para entrar na equipe.",
      );
    } catch {
      setFailed(true);
      setMessage(
        "Não foi possível enviar o convite. Confira se esta conta de barbeiro está disponível.",
      );
    }
  }
  async function removeInvitation(id: string) {
    setMessage("");
    try {
      await revoke.mutateAsync(id);
      setFailed(false);
      setMessage("Convite cancelado.");
    } catch {
      setFailed(true);
      setMessage("Não foi possível cancelar o convite.");
    }
  }
  async function removeBarber(id: string) {
    setMessage("");
    try {
      await unlink.mutateAsync(id);
      setFailed(false);
      setMessage("Barbeiro removido da equipe.");
    } catch {
      setFailed(true);
      setMessage(
        "Não foi possível remover o barbeiro. Verifique os agendamentos existentes.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="section-title">Equipe</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Convide barbeiros que já têm uma conta. Cada profissional gerencia seu
          próprio expediente.
        </p>
      </header>
      <section className="panel space-y-5" aria-labelledby="team-title">
        <h3 id="team-title" className="text-lg font-semibold">
          Profissionais
        </h3>
        {barbers.isLoading && <p role="status">Carregando equipe…</p>}
        {barbers.isError && (
          <p role="alert">
            Não foi possível carregar a equipe.{" "}
            <button
              className="underline"
              onClick={() => void barbers.refetch()}
            >
              Tentar novamente
            </button>
          </p>
        )}
        <ul className="divide-y">
          {barbers.data?.map((barber) => (
            <li
              key={barber.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-semibold">{barber.name}</p>
                <p className="text-sm text-muted-foreground">
                  {barber.role === "owner" ? "Proprietário" : "Barbeiro"}
                </p>
              </div>
              {barber.role === "barber" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={unlink.isPending}
                      aria-label={`Remover ${barber.name}`}
                    >
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remover {barber.name} da equipe?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        O expediente e as folgas deste profissional serão
                        removidos. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter na equipe</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void removeBarber(barber.id)}
                      >
                        Confirmar remoção
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="panel space-y-5" aria-labelledby="invite-title">
        <div>
          <h3 id="invite-title" className="text-lg font-semibold">
            Convidar barbeiro
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            O convite aparece na conta do profissional para ele aceitar ou
            recusar.
          </p>
        </div>
        <form
          onSubmit={(event) => void sendInvite(event)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block min-w-0 flex-1">
            E-mail do barbeiro
            <input
              className="mt-2 block w-full"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="barbeiro@exemplo.com"
            />
          </label>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
        </form>
        {invitations.isError && (
          <p role="alert">
            Não foi possível carregar os convites.{" "}
            <button
              className="underline"
              onClick={() => void invitations.refetch()}
            >
              Tentar novamente
            </button>
          </p>
        )}
        {!!invitations.data?.length && (
          <div className="border-t pt-5">
            <h4 className="font-semibold">Convites pendentes</h4>
            <ul className="mt-3 divide-y">
              {invitations.data.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <span className="break-all text-sm">{item.email}</span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={revoke.isPending}
                    onClick={() => void removeInvitation(item.id)}
                  >
                    Cancelar convite
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
}
