import { Calendar, User, LogOut, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, onLogout }: NavbarProps) => {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
              B
            </div>
            <span className="font-semibold text-lg">BarberShop API</span>
          </Link>

          {/* links centrais */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/services" className="text-sm hover:underline">
              Serviços
            </Link>
            <Link to="/contact" className="text-sm hover:underline">
              Contato
            </Link>
          </nav>

          {/* ações de autenticação */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:flex items-center gap-2"
                >
                  <Link to="/appointments">
                    <Calendar size={16} />
                    Agendamentos
                  </Link>
                </Button>

                {/* avatar + dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{<User size={14} />}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm">Perfil</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Meu Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                  asChild
                >
                  <Link to="/login">
                    <LogIn size={16} /> Entrar
                  </Link>
                </Button>

                <Button
                  size="sm"
                  className="hidden sm:flex items-center gap-2 bg-slate-900 text-white"
                  asChild
                >
                  <Link to="/signup">
                    <UserPlus size={16} /> Criar conta
                  </Link>
                </Button>

                {/* mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="sm:hidden">
                      <User size={18} />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link to="/login">Entrar</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/signup">Criar conta</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
