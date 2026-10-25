import {
  CalendarDays,
  UserRound,
  LogOut,
  Scissors,
  Search,
  Store,
  Clock3,
} from "lucide-react";
import type { User } from "@/types/user.type";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link, NavLink } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavbarProps {
  isAuthenticated: boolean;
  user?: User;
  onLogout?: () => void;
}
export const Navbar = ({ isAuthenticated, user, onLogout }: NavbarProps) => {
  const professional = user?.role === "owner" || user?.role === "barber";
  const shopId = user?.barberShop?.id;
  const links = professional
    ? [
        { to: "/", label: "Visão geral", icon: Scissors, end: true },
        { to: "/appointments", label: "Agenda", icon: CalendarDays },
        ...(user?.role === "owner" && shopId
          ? [{ to: `/barber-shop/${shopId}`, label: "Barbearia", icon: Store }]
          : []),
        ...(shopId
          ? [{ to: "/availability", label: "Expediente", icon: Clock3 }]
          : []),
      ]
    : [
        { to: "/", label: "Barbearias", icon: Search, end: true },
        { to: "/appointments", label: "Meus horários", icon: CalendarDays },
      ];
  const mobileLinks =
    user?.role === "owner"
      ? links.filter((link) => link.to !== "/availability")
      : links;
  return (
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
              className="hidden md:flex items-center gap-1"
            >
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} className="site-nav-link" to={to} end={end}>
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
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
                    <Link to="/profile">Minha conta</Link>
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
          {mobileLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={21} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <NavLink to="/profile">
            <UserRound size={21} aria-hidden="true" />
            Minha conta
          </NavLink>
        </nav>
      )}
    </>
  );
};
