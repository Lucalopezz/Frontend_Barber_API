import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";
import { ToastContainer } from "react-toastify";
import { useUser } from "./hooks/useUser";
import { useGetUser } from "./hooks/queries/user/useGetUser";
import { Footer } from "./components/layout/footer";

export const App = () => {
  const { authenticated, logout } = useUser();
  const { data: user } = useGetUser(false, false);
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <Navbar isAuthenticated={authenticated} user={user} onLogout={logout} />
      <main
        id="main-content"
        className="app-shell flex-1 min-w-0 pb-6"
        tabIndex={-1}
      >
        <ToastContainer position="top-right" />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
