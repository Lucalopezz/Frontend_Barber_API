import { Mail, Phone } from "lucide-react";

export const Contact = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-semibold text-center">Contato</h1>

        <p className="text-center text-sm text-gray-600">
          Caso tenha encontrado algum problema ao utilizar o sistema de
          gerenciamento e agendamento da barbearia, entre em contato pelos
          canais abaixo:
        </p>

        <div className="space-y-2 text-center">
          <p className="font-bold flex items-center gap-2 justify-center">
            <Mail className="size-4" />
            Email:
          </p>
          <p className="text-gray-700">BarberAPI@myBarberShop.com</p>

          <p className="font-bold mt-4 flex items-center gap-2 justify-center">
            <Phone className="size-4" />
            Telefone:
          </p>
          <p className="text-gray-700">33 303051894</p>
        </div>
      </div>
    </div>
  );
};
