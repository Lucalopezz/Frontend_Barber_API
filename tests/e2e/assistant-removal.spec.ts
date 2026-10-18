import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`assistant access is absent from account and navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() =>
      localStorage.setItem("token", "assistant-removal-test"),
    );
    await page.route("**/api/v1/**", (route) => {
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
      page.getByRole("menuitem", { name: "Meu Perfil" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /assistente/i }),
    ).toHaveCount(0);
    await expect(page.locator('a[href="/assistant"]')).toHaveCount(0);
    await page.keyboard.press("Escape");

    const navigation = page.getByRole("navigation", {
      name: width === 360 ? "Navegação no celular" : "Navegação principal",
    });
    await navigation.getByRole("link", { name: "Agendamentos" }).click();
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
      await page.addInitScript(() =>
        localStorage.setItem("token", "assistant-removal-test"),
      );
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
