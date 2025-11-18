import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";
import { ToastContainer } from "react-toastify";

export const App = () => {
  return (
    <>
      <Navbar isAuthenticated={false} />
      <main className="bg-neutral-50 min-h-screen container mx-auto">
        <ToastContainer />
        <Outlet />
      </main>
    </>
  );
};
