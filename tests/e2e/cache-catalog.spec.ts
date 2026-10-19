import { expect, test } from "@playwright/test";
import { mockSession } from "./session-fixture";

test("reutiliza a vitrine por cinco minutos e consulta novamente ao expirar", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  await mockSession(page, "catalog-cache-test");
  let catalogRequests = 0;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (path.endsWith("/users/me")) {
      return route.fulfill({
        json: { data: { id: "client-1", name: "Cliente", role: "client" } },
      });
    }
    if (path.endsWith("/barber-shops") && request.method() === "GET") {
      catalogRequests += 1;
      if (catalogRequests === 2) {
        return route.fulfill({ status: 403, json: { message: "Forbidden" } });
      }
      return route.fulfill({
        json: {
          data: [{ id: "shop-1", name: "Barbearia Escola", address: "Rua 1" }],
          meta: { currentPage: 1, perPage: 20, lastPage: 1, total: 1 },
        },
      });
    }
    return route.fulfill({ json: { data: [] } });
  });

  await page.goto("/");
  await expect(page.getByText("Barbearia Escola")).toBeVisible();
  await expect.poll(() => catalogRequests).toBe(1);

  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await page.getByRole("link", { name: "Barber, início" }).click();
  await expect(page.getByText("Barbearia Escola")).toBeVisible();
  await expect.poll(() => catalogRequests).toBe(1);

  await page.clock.fastForward(301_000);
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await page.getByRole("link", { name: "Barber, início" }).click();
  await expect(page.getByText("Barbearia Escola")).toBeVisible();
  await expect.poll(() => catalogRequests).toBe(2);
  await expect(page.getByRole("alert")).toContainText("Não foi possível atualizar as barbearias");
});

test("preserva detalhes da barbearia com indicação quando a revalidação falha", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  await mockSession(page, "shop-detail-cache-test");
  let shopRequests = 0;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (path.endsWith("/users/me")) return route.fulfill({ json: { data: { id: "client-1", name: "Cliente", role: "client" } } });
    if (path.endsWith("/barber-shops") && request.method() === "GET") {
      return route.fulfill({ json: { data: [{ id: "shop-1", name: "Barbearia Escola", address: "Rua 1" }], meta: { currentPage: 1, perPage: 20, lastPage: 1, total: 1 } } });
    }
    if (path.endsWith("/barber-shops/shop-1")) {
      shopRequests++;
      if (shopRequests === 2) return route.fulfill({ status: 403, json: { message: "Forbidden" } });
      return route.fulfill({ json: { data: { id: "shop-1", name: "Barbearia Escola", address: "Rua 1" } } });
    }
    return route.fulfill({ json: { data: [] } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agendar em Barbearia Escola" })).toBeVisible();
  await expect.poll(() => shopRequests).toBe(1);
  await page.getByRole("link", { name: "Barber, início" }).click();
  await expect(page.getByText("Barbearia Escola")).toBeVisible();
  await page.clock.fastForward(301_000);
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await expect.poll(() => shopRequests).toBe(2);
  await expect(page.getByRole("heading", { name: "Agendar em Barbearia Escola" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Não foi possível atualizar os dados desta barbearia");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
