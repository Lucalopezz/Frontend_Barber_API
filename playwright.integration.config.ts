import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const apiDirectory = resolve(
  process.env.BARBER_API_DIR ?? "../Projeto_Barber_API",
);
const testEnvironment = parseEnv(
  readFileSync(resolve(apiDirectory, ".env.test"), "utf8"),
);
if (
  testEnvironment.NODE_ENV !== "test" ||
  new URL(testEnvironment.DATABASE_URL).searchParams.get("schema") !==
    "barber_api_test"
) {
  throw new Error(
    "A integração exige .env.test com NODE_ENV=test e schema=barber_api_test.",
  );
}

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  timeout: 90_000,
  use: {
    actionTimeout: 10_000,
    baseURL: "http://127.0.0.1:5175",
    timezoneId: "UTC",
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm exec dotenv -e .env.test -- node dist/main",
      cwd: apiDirectory,
      url: "http://127.0.0.1:3002/docs",
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        APP_PORT: "3002",
        CORS_ALLOWED_ORIGINS: "http://127.0.0.1:5175",
      },
      gracefulShutdown: { signal: "SIGTERM", timeout: 1000 },
    },
    {
      command: "pnpm dev --host 127.0.0.1 --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: false,
      env: { VITE_API_URL: "http://127.0.0.1:3002/api/v1" },
      gracefulShutdown: { signal: "SIGTERM", timeout: 1000 },
    },
  ],
});
