import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router/dom";

import { QueryProvider } from "./providers/QueryProvider.tsx";
import { routes } from "./routes/routes.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={routes} />,
    </QueryProvider>
  </StrictMode>,
);
