import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router/dom";

import { QueryProvider } from "./providers/QueryProvider.tsx";
import { routes } from "./routes/routes.tsx";
import { UserProvider } from "./context/UserProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <UserProvider>
        <RouterProvider router={routes} />
      </UserProvider>
    </QueryProvider>
  </StrictMode>,
);
