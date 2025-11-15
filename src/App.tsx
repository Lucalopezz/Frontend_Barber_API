import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";

export const App = () => {
  return (
    <>
      <Navbar isAuthenticated={true} />
      <main>
        <Outlet />
        main
      </main>
    </>
  );
};
