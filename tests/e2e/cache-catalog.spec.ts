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
});
