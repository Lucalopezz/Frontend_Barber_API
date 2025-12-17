import { Calendar } from "lucide-react";
import type { Role } from "@/types/user.type";

export const AppointmentsHeader = ({ role }: { role?: Role }) => {
  return (
    <header className="flex items-center gap-3">
      <Calendar className="w-6 h-6" />
      <div>
        <h1 className="text-2xl font-semibold">Agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          {role === "barber"
            ? "Gerencie os atendimentos da sua barbearia"
            : "Crie e gerencie seus agendamentos"}
        </p>
      </div>
    </header>
  );
};
