import { expect, test, type Page, type Route } from "@playwright/test";
import { mockSession } from "./session-fixture";

const shop = { id: "shop-1", name: "Navalha Clube", address: "Rua Um, 12, São Paulo - SP", ownerId: "owner", timezone: "America/Sao_Paulo" };
const barbers = [{ id: "owner", name: "João", role: "owner" }, { id: "staff", name: "Ana", role: "barber" }];
const service = { id: "service-1", name: "Corte", duration: 30, price: 40, barberShopId: shop.id };
const slot = "2030-10-21T12:00:00.000Z";
const reply = (route: Route, data: unknown, status = 200) => route.fulfill({ status, json: { data, meta: { lastPage: 1 } } });

async function setup(page: Page, role: "owner" | "barber" | "client", handler?: (route: Route, path: string) => Promise<boolean>) {
  await mockSession(page, `team-${role}`);
  await page.clock.setFixedTime(new Date("2030-10-15T12:00:00.000Z"));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (handler && await handler(route, path)) return;
    if (path.endsWith("/users/me")) return reply(route, { id: role, email: `${role}@example.test`, name: role === "owner" ? "João" : role === "barber" ? "Ana" : "Cliente", role, barberShop: role === "owner" ? { ...shop, relationship: "owner" } : null });
    if (path.endsWith("/barber-shops/shop-1/barbers")) return reply(route, barbers);
    if (path.endsWith("/barber-shops/shop-1/invitations")) return reply(route, []);
    if (path.endsWith("/barber-shops/invitations/me")) return reply(route, []);
    if (path.endsWith("/barber-shops/shop-1/availability")) return reply(route, { timezone: shop.timezone, slots: [{ startsAt: slot, endsAt: "2030-10-21T12:30:00.000Z" }] });
    if (path.endsWith("/barber-shops/shop-1")) return reply(route, shop);
    if (path.endsWith("/barber-shops")) return reply(route, [shop]);
    if (path.endsWith("/services")) return reply(route, [service]);
    if (path.endsWith("/appointments")) return reply(route, []);
    return reply(route, {});
  });
}

test("owner invites an existing barber from a focused team page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const invitations: unknown[] = [];
  await setup(page, "owner", async (route, path) => {
    if (path.endsWith("/barber-shops/shop-1/invitations") && route.request().method() === "POST") {
      invitations.push(route.request().postDataJSON());
      await reply(route, { id: "invite-1", email: "ana@example.test", shopName: shop.name }, 201);
      return true;
    }
    return false;
  });
  await page.goto("/barber-shop/shop-1/team");
  await expect(page.getByRole("navigation", { name: "Gestão da barbearia" }).getByRole("link", { name: "Equipe" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("João", { exact: true })).toBeVisible();
  await page.getByLabel("E-mail do barbeiro").fill("ana@example.test");
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(page.getByRole("status")).toContainText("Convite enviado");
  expect(invitations).toEqual([{ email: "ana@example.test" }]);
});

test("owner confirms before removing a barber from the team", async ({ page }) => {
  let removals = 0;
  await setup(page, "owner", async (route, path) => {
    if (path.endsWith("/barber-shops/shop-1/barbers/staff") && route.request().method() === "DELETE") {
      removals++;
      await route.fulfill({ status: 204 });
      return true;
    }
    return false;
  });
  await page.goto("/barber-shop/shop-1/team");
  await page.getByRole("button", { name: "Remover Ana" }).click();
  await expect(page.getByRole("alertdialog", { name: "Remover Ana da equipe?" })).toBeVisible();
  expect(removals).toBe(0);
  await page.getByRole("button", { name: "Confirmar remoção" }).click();
  await expect.poll(() => removals).toBe(1);
});

test("client chooses a professional and booking uses that barber's availability", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let availableFor = "";
  let booking: Record<string, string> | undefined;
  await setup(page, "client", async (route, path) => {
    if (path.endsWith("/barber-shops/shop-1/availability")) {
      availableFor = new URL(route.request().url()).searchParams.get("barberId") ?? "";
      await reply(route, { timezone: shop.timezone, slots: [{ startsAt: slot, endsAt: "2030-10-21T12:30:00.000Z" }] });
      return true;
    }
    if (path.endsWith("/appointments") && route.request().method() === "POST") {
      booking = route.request().postDataJSON();
      await reply(route, { id: "appt-1" }, 201);
      return true;
    }
    return false;
  });
  await page.goto("/book/shop-1");
  await page.getByLabel("Serviço", { exact: true }).selectOption(service.id);
  await page.getByLabel("Profissional", { exact: true }).selectOption("staff");
  await page.getByLabel("Data", { exact: true }).fill("2030-10-21");
  await expect(page.getByRole("button", { name: "09:00" })).toBeVisible();
  expect(availableFor).toBe("staff");
  await page.getByRole("button", { name: "09:00" }).click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("status")).toContainText("Agendamento criado");
  expect(booking).toMatchObject({ serviceId: service.id, barberId: "staff", date: slot });
});

test("barber accepts a shop invitation before becoming staff", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let accepted = false;
  await setup(page, "barber", async (route, path) => {
    if (path.endsWith("/users/me") && accepted) {
      await reply(route, { id: "barber", email: "barber@example.test", name: "Ana", role: "barber", barberShop: { ...shop, relationship: "barber" } });
      return true;
    }
    if (path.endsWith("/barber-shops/invitations/me")) {
      await reply(route, accepted ? [] : [{ id: "invite-1", email: "barber@example.test", barberShopId: shop.id, shopName: shop.name, barberId: "barber", barberName: "Ana", createdAt: "2030-10-01" }]);
      return true;
    }
    if (path.endsWith("/barber-shops/invitations/invite-1/accept")) {
      accepted = true;
      await reply(route, { id: "barber", role: "barber", barberShopId: shop.id }, 201);
      return true;
    }
    return false;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Convites para sua conta" })).toBeVisible();
  await page.getByRole("button", { name: "Aceitar" }).click();
  await expect(page.getByRole("link", { name: "Gerenciar expediente" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convites para sua conta" })).toHaveCount(0);
  expect(accepted).toBe(true);
});
