import { App } from "@/App";
import { ErrorComponent } from "@/components/layout/errorComponent";
import { createBrowserRouter } from "react-router-dom";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorComponent />,
  },
]);
