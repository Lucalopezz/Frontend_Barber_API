import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";
import { ToastContainer } from "react-toastify";
import { useUser } from "./hooks/useUser";
import { Footer } from "./components/layout/footer";

export const App = () => {
  const { authenticated, logout } = useUser();
  return (
    <>
      <Navbar isAuthenticated={authenticated} onLogout={logout} />
      <main className="min-h-screen container mx-auto">
        <ToastContainer />
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
