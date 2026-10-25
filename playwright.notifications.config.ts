import { defineConfig } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import integration from "./playwright.integration.config";

// Keep the existing integration journey independent of Redis. This runner adds
// the actual worker only for the notification journey, using an isolated queue.
export default defineConfig({
  // defineConfig(base, overrides) concatenates webServer arrays. Spread the
  // base once so API and Vite start only once alongside the additional worker.
  ...integration,
  testMatch: "**/notifications.real.spec.ts",
  testIgnore: [],
  webServer: [
    ...(Array.isArray(integration.webServer) ? integration.webServer : []),
    {
      command: "pnpm exec dotenv -e .env.test -- node dist/worker",
      cwd: resolve(process.env.BARBER_API_DIR ?? "../Projeto_Barber_API"),
      env: {
        NODE_ENV: "test",
        REDIS_DB: "1",
        NOTIFICATIONS_QUEUE_PREFIX: `barber-test-notifications-ui-${randomUUID()}`,
      },
      wait: { stdout: /Worker de notificações iniciado/ },
      timeout: 30_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    },
  ],
});
