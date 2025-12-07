import { Calendar } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-10 text-center text-sm text-gray-500 my-10">
      <p className="flex items-center justify-center gap-2">
        <Calendar size={14} />
        <span>
          Gerenciamento de agendamentos — suporte: BarberAPI@myBarberShop.com
        </span>
      </p>
    </footer>
  );
};
