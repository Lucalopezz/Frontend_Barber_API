import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";

export const App = () => {
  return (
    <>
      <Navbar isAuthenticated={false} />
      <main>
        <Outlet />
      </main>
    </>
  );
};
