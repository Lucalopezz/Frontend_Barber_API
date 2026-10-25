import { mockSession } from "./session-fixture";
import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const shop = {
  id: "shop-1",
  name: "Navalha Clube — barbearia e cuidados",
  address: "Rua das Palmeiras, 120, Belo Horizonte – MG",
  timezone: "America/Sao_Paulo",
  createdAt: "2026-01-01",
};
async function setup(page: Page, role: "client" | "owner") {
  await mockSession(page, "responsive-test");
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    let data: unknown = [];
    if (path.endsWith("/users/me"))
      data = {
        id: "user-1",
        name: "Lucas Lopes",
        email: "lucas@example.test",
        role,
        createdAt: "2026-01-01",
        barberShop:
          role === "owner" ? { ...shop, relationship: "owner" } : null,
      };
    else if (path.endsWith("/barber-shops/shop-1/barbers"))
      data = [
        { id: "user-1", name: "Lucas Lopes", role: "owner" },
        { id: "barber-2", name: "Ana Souza", role: "barber" },
      ];
    else if (path.endsWith("/barber-shops/shop-1/invitations")) data = [];
    else if (path.endsWith("/barber-shops/shop-1")) data = shop;
    else if (path.endsWith("/barber-shops"))
      data = [
        shop,
        {
          ...shop,
          id: "shop-2",
          name: "Estúdio do Barbeiro",
          address: "Av. Brasil, 405, Belo Horizonte – MG",
        },
      ];
    else if (path.endsWith("/services"))
      data = [
        {
          id: "service-1",
          name: "Corte na tesoura",
          description: "Corte com tesoura, lavagem e acabamento na navalha.",
          duration: 45,
          price: 65.5,
          barberShopId: shop.id,
        },
      ];
    else if (path.endsWith("/availability/me"))
      data = {
        timezone: shop.timezone,
        schedules: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1080 }],
        timeOffs: [],
      };
    else if (path.endsWith("/appointments"))
      data = [
        {
          id: "appt-1",
          status: "scheduled",
          date: "2030-10-21T12:00:00Z",
          clientId: "user-1",
          serviceId: "service-1",
          barberShopId: shop.id,
        },
      ];
    await route.fulfill({
      json: {
        data,
        meta: { lastPage: 1, total: Array.isArray(data) ? data.length : 1 },
      },
    });
  });
}
async function noOverflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("cabeçalho do dono mantém sino e navegação acessíveis em 768px sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await setup(page, "owner");
  await page.route("**/notifications/unread-count", (route) =>
    route.fulfill({ json: { data: { count: 23 } } }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Seu salão, em dia.", exact: true })).toBeVisible();
  const bell = page.getByRole("link", { name: "Notificações", exact: true });
  await expect(bell).toHaveAccessibleDescription("23 notificações não lidas.");
  await expect(page.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir menu da conta", exact: true })).toBeVisible();
  await noOverflow(page);
  const bounds = await bell.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(768);
  await bell.click();
  await expect(page).toHaveURL(/\/notifications$/);
});

for (const width of [360, 768, 1440]) {
  test(`principais telas responsivas a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page, "owner");
    await mkdir("output/playwright", { recursive: true });
    for (const [path, heading, name] of [
      ["/", "Seu salão, em dia.", "owner"],
      ["/barber-shop/shop-1/services", "Sua barbearia", "management"],
      ["/barber-shop/shop-1/team", "Sua barbearia", "team"],
      ["/availability", "Meu expediente", "availability"],
      ["/appointments", "Agendamentos", "appointments"],
      ["/profile", "Minha conta", "profile"],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await noOverflow(page);
      await page.screenshot({
        path: `output/playwright/${name}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
      if (name === "management") {
        await page
          .locator('[data-slot="card"]')
          .filter({ hasText: "Corte na tesoura" })
          .getByRole("button", { name: "Editar", exact: true })
          .click();
        const dialog = page.getByRole("dialog", { name: "Editar serviço" });
        await expect(dialog).toBeVisible();
        const bounds = await dialog.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.width).toBeLessThanOrEqual(width - 32);
        expect(bounds!.height).toBeLessThanOrEqual(868);
        await noOverflow(page);
        await page.screenshot({
          path: `output/playwright/service-dialog-${width}.png`,
          animations: "disabled",
        });
        await dialog
          .getByRole("button", { name: "Fechar", exact: true })
          .click();
      }
    }
    if (width === 360) {
      const nav = page.getByRole("navigation", {
        name: "Navegação no celular",
      });
      await expect(nav).toBeVisible();
      await nav.getByRole("link", { name: "Agenda" }).click();
      await expect(page).toHaveURL(/\/appointments$/);
      await page.getByRole("button", { name: "Abrir menu da conta" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Minha conta" }),
      ).toBeVisible();
    }
  });
  test(`catálogo, reserva e autenticação a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page, "client");
    await mkdir("output/playwright", { recursive: true });
    for (const [path, heading, name] of [
      ["/", "Seu corte. No seu tempo.", "catalog"],
      ["/book/shop-1", `Agendar em ${shop.name}`, "booking"],
      ["/login", "Entrar na Barber", "login"],
      ["/signup", "Crie sua conta.", "signup"],
      ["/services", "Um horário, sem complicar.", "help"],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await noOverflow(page);
      await page.screenshot({
        path: `output/playwright/${name}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  });
}
