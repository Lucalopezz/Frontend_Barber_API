import { App } from "@/App";
import { ErrorComponent } from "@/components/layout/errorComponent";
import { Login } from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import { HomePage } from "@/pages/home/homePage";
import { createBrowserRouter } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorComponent />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        ),
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Register />,
      },
    ],
  },
]);
