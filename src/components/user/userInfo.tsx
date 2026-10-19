import { Skeleton } from "@/components/ui/skeleton";
import type { User as UserType } from "@/types/user.type";
import { Mail, User, BadgeCheck, Calendar } from "lucide-react";

type UserInfoProps = {
  data: UserType | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
};

export const UserInfo = ({ data, isLoading, error, onRetry }: UserInfoProps) => {
  if (isLoading) {
    return (
      <div className="panel w-full space-y-4">
        <Skeleton className="h-6 w-32 mx-auto" />
        <div className="flex flex-col items-center gap-4 mt-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel w-full" role="alert">
        <p>Não foi possível atualizar os dados da conta. Verifique a conexão e tente novamente.</p>
        <button className="underline" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }
  return (
    <div className="panel w-full">
      <h2 className="text-lg font-semibold mb-6">Seu Perfil</h2>
      {error && (
        <div className="mb-4" role="status">
          Não foi possível atualizar os dados da conta. Os dados exibidos podem estar desatualizados. {" "}
          <button className="underline" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}

      {/* Avatar simples */}
      <div className="flex flex-col items-center mb-6">
        <div className="h-20 w-20 flex items-center justify-center rounded-full bg-slate-200">
          <User size={40} />
        </div>
        <p className="mt-3 break-words text-lg font-medium">{data.name}</p>
        <p className="text-muted-foreground text-sm break-all">{data.email}</p>
      </div>

      <div className="space-y-4">
        {/* Papel */}
        <div className="flex items-center gap-3">
          <BadgeCheck size={18} className="text-slate-700" />
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Tipo de conta:</span>{" "}
            {data.role === "owner"
              ? "Proprietário"
              : data.role === "barber"
                ? "Barbeiro"
                : "Cliente"}
          </p>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-slate-700" />
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Email:</span> {data.email}
          </p>
        </div>

        {/* Data de criação */}
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-slate-700" />
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Conta criada em:</span>{" "}
            {new Date(data.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
};
