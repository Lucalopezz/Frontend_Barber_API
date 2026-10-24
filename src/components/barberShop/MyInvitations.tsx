import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useMyInvitations,
  useTeamAction,
} from "@/hooks/queries/barberShops/useShopTeam";
import api from "@/utils/api";

export function MyInvitations() {
  const query = useMyInvitations(true);
  const action = useTeamAction(
    ({ id, response }: { id: string; response: "accept" | "decline" }) =>
      api.post(`/barber-shops/invitations/${id}/${response}`),
  );
  const [message, setMessage] = useState("");
  if (query.isLoading) return <p role="status">Buscando convites…</p>;
  if (query.isError)
    return (
      <p role="alert">
        Não foi possível carregar seus convites.{" "}
        <button className="underline" onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      </p>
    );
  if (!query.data?.length) return null;
  async function respond(id: string, response: "accept" | "decline") {
    setMessage("");
    try {
      await action.mutateAsync({ id, response });
      setMessage(
        response === "accept"
          ? "Convite aceito. Sua barbearia já está disponível."
          : "Convite recusado.",
      );
    } catch {
      setMessage("Não foi possível responder ao convite. Tente novamente.");
    }
  }
  return (
    <section className="panel space-y-4">
      <h2 className="section-title">Convites para sua conta</h2>
      <p className="text-sm text-muted-foreground">
        Aceite um convite para atender na equipe dessa barbearia.
      </p>
      <ul className="divide-y">
        {query.data.map((invite) => (
          <li
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div>
              <p className="font-semibold">{invite.shopName}</p>
              <p className="text-sm text-muted-foreground">
                Convite para {invite.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={action.isPending}
                onClick={() => void respond(invite.id, "accept")}
              >
                Aceitar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={action.isPending}
                onClick={() => void respond(invite.id, "decline")}
              >
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
