import {
  CalendarDays,
  UserRound,
  LogOut,
  Scissors,
  Search,
  FlaskConical,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link, NavLink } from "react-router-dom";

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
}
export const Navbar = ({ isAuthenticated, onLogout }: NavbarProps) => (
  <>
    <header className="border-b bg-white">
      <div className="app-shell flex h-20 items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Barber, início"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <Scissors size={23} aria-hidden="true" />
          </span>
          <span className="font-['Barlow_Condensed'] text-3xl font-bold leading-none tracking-tight">
            Barber<span className="text-[#883d43]">.</span>
          </span>
        </Link>
        {isAuthenticated && (
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-2"
          >
            <NavLink className="site-nav-link" to="/" end>
              <Search size={16} aria-hidden="true" />
              Início
            </NavLink>
            <NavLink className="site-nav-link" to="/appointments">
              <CalendarDays size={16} aria-hidden="true" />
              Agendamentos
            </NavLink>
          </nav>
        )}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/signup">Criar conta</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label="Abrir menu da conta">
                  <UserRound size={17} aria-hidden="true" />
                  <span className="hidden sm:inline">Minha conta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Meu Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/services">
                    <CircleHelp aria-hidden="true" />
                    Como funciona
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/assistant">
                    <FlaskConical aria-hidden="true" />
                    Assistente experimental
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut size={16} aria-hidden="true" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
    {isAuthenticated && (
      <nav aria-label="Navegação no celular" className="mobile-dock">
        <NavLink to="/" end>
          <Search size={21} aria-hidden="true" />
          Início
        </NavLink>
        <NavLink to="/appointments">
          <CalendarDays size={21} aria-hidden="true" />
          Agendamentos
        </NavLink>
        <NavLink to="/profile">
          <UserRound size={21} aria-hidden="true" />
          Minha conta
        </NavLink>
      </nav>
    )}
  </>
);
