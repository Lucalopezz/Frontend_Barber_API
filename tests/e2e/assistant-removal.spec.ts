import { mockSession } from "./session-fixture";
import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`assistant access is absent from account and navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockSession(page, "assistant-removal-test");
    await page.route("**/api/v1/**", (route) => {
      if (new URL(route.request().url()).pathname.includes("/auth/")) return route.fallback();
      const profile = new URL(route.request().url()).pathname.endsWith("/users/me");
      return route.fulfill({
        json: {
          data: profile
            ? {
                id: "removal-client",
                name: "Cliente",
                email: "client@example.test",
                role: "client",
                createdAt: "2026-01-01",
                barberShop: null,
              }
            : [],
          meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 15 },
        },
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu da conta" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Minha conta" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /assistente/i }),
    ).toHaveCount(0);
    await expect(page.locator('a[href="/assistant"]')).toHaveCount(0);
    await page.keyboard.press("Escape");

    const navigation = page.getByRole("navigation", {
      name: width === 360 ? "Navegação no celular" : "Navegação principal",
    });
    await navigation.getByRole("link", { name: "Meus horários" }).click();
    await expect(page).toHaveURL(/\/appointments$/);
    await expect(
      page.getByRole("heading", { name: "Agendamentos", exact: true }),
    ).toBeVisible();
  });
}

for (const authenticated of [false, true]) {
  test(`former assistant URL uses the existing missing-page fallback (${authenticated ? "authenticated" : "anonymous"})`, async ({
    page,
  }) => {
    if (authenticated) {
      await mockSession(page, "assistant-removal-test");
    }
    const requests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/v1/assistant/chat") {
        requests.push(request.url());
      }
    });

    await page.goto("/assistant");
    await expect(page).toHaveURL(/\/assistant$/);
    await expect(
      page.getByRole("heading", { name: "Oops!", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Alguma coisa deu errado. Tente novamente mais tarde."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Assistente de consultas" }),
    ).toHaveCount(0);
    expect(requests).toEqual([]);
  });
}
