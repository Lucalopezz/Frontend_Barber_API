import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const api = "http://127.0.0.1:3002/api/v1";
const apiDirectory = resolve(process.env.BARBER_API_DIR ?? "../Projeto_Barber_API");
const fixture = randomUUID();
const password = `Password-${randomUUID()}`;
const users: string[] = [];
const owner = { name: "Profissional da confirmação", email: `owner-notification-${fixture}@example.test` };
const client = { name: "Cliente da confirmação", email: `client-notification-${fixture}@example.test` };
const outsider = { name: "Outro cliente", email: `other-notification-${fixture}@example.test` };
const shopName = `Barbearia confirmação ${fixture}`;
const serviceName = `Corte confirmação ${fixture}`;

async function login(page: Page, account: { email: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(account.email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.afterAll(async () => {
  const environment = parseEnv(readFileSync(resolve(apiDirectory, ".env.test"), "utf8"));
  if (environment.NODE_ENV !== "test" || new URL(environment.DATABASE_URL).searchParams.get("schema") !== "barber_api_test") {
    throw new Error("Cleanup de notificações recusado fora de barber_api_test.");
  }
  type Model = { deleteMany(input: { where: Record<string, unknown> }): Promise<unknown> };
  type Database = { appointment: Model; barberSchedule: Model; barberTimeOff: Model; service: Model; barberShop: Model; user: Model; $disconnect(): Promise<void> };
  const require = createRequire(resolve(apiDirectory, "package.json"));
  const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (options: { datasourceUrl: string }) => Database };
  const database = new PrismaClient({ datasourceUrl: environment.DATABASE_URL });
  try {
    // Notifications and outbox entries belong to these appointments and cascade.
    await database.appointment.deleteMany({ where: { OR: [{ clientId: { in: users } }, { barberId: { in: users } }] } });
    await database.barberTimeOff.deleteMany({ where: { barberId: { in: users } } });
    await database.barberSchedule.deleteMany({ where: { barberId: { in: users } } });
    await database.service.deleteMany({ where: { barberShop: { ownerId: { in: users } } } });
    await database.barberShop.deleteMany({ where: { ownerId: { in: users } } });
    await database.user.deleteMany({ where: { id: { in: users } } });
  } finally { await database.$disconnect(); }
});

test("reserva confirmada chega às caixas do cliente e profissional pelo worker real", async ({ browser, request }) => {
  for (const [account, role] of [[owner, "barber"], [client, "client"], [outsider, "client"]] as const) {
    const response = await request.post(`${api}/users`, { data: { ...account, password, role } });
    expect(response.status()).toBe(201);
    users.push((await response.json()).data.id);
  }
  const loginOwner = await request.post(`${api}/users/login`, { data: { email: owner.email, password } });
  expect(loginOwner.status()).toBe(201);
  const authorization = `Bearer ${(await loginOwner.json()).accessToken}`;
  const shopResponse = await request.post(`${api}/barber-shops`, {
    headers: { authorization },
    data: { name: shopName, address: "Rua das Flores, 123, São Paulo - SP", timezone: "America/Sao_Paulo" },
  });
  expect(shopResponse.status()).toBe(201);
  const shopId = (await shopResponse.json()).data.id;
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 7);
  target.setUTCHours(12, 0, 0, 0);
  const schedule = await request.put(`${api}/appointments/availability/me/schedule`, {
    headers: { authorization },
    data: { schedules: [{ dayOfWeek: target.getUTCDay(), startMinute: 540, endMinute: 1020 }] },
  });
  expect(schedule.status()).toBe(200);
  const serviceResponse = await request.post(`${api}/services`, {
    headers: { authorization }, data: { name: serviceName, description: "Confirmação por fila", price: 60, duration: 30 },
  });
  expect(serviceResponse.status()).toBe(201);
  const serviceId = (await serviceResponse.json()).data.id;
  const customerContext = await browser.newContext({ timezoneId: "UTC" });
  const professionalContext = await browser.newContext({ timezoneId: "UTC" });
  try {
    const customerPage = await customerContext.newPage();
    await login(customerPage, client);
    await customerPage.goto(`/book/${shopId}`);
    await customerPage.getByLabel("Serviço", { exact: true }).selectOption(serviceId);
    await expect(customerPage.getByLabel("Profissional", { exact: true })).not.toHaveValue("");
    await customerPage.getByLabel("Data", { exact: true }).fill(target.toISOString().slice(0, 10));
    await customerPage.getByRole("button", { name: "09:00", exact: true }).click();
    const booked = customerPage.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/v1/appointments");
    await customerPage.getByRole("button", { name: "Confirmar agendamento", exact: true }).click();
    expect((await booked).status()).toBe(201);

    const clientToken = await customerPage.evaluate(async () => (await import("/src/auth/session.ts")).getAccessToken());
    await expect.poll(async () => {
      const response = await request.get(`${api}/notifications`, { headers: { authorization: `Bearer ${clientToken}` } });
      expect(response.status()).toBe(200);
      return (await response.json()).data.filter((item: { serviceName: string }) => item.serviceName === serviceName).length;
    }, { timeout: 20_000 }).toBe(1);
    await customerPage.getByRole("link", { name: "Notificações", exact: true }).click();
    await expect(customerPage.getByText(`${serviceName} em ${shopName}`, { exact: true })).toBeVisible();
    await expect(customerPage.locator("time")).toContainText("09:00");
    await customerPage.getByRole("link", { name: "Ver na agenda" }).click();
    await expect(customerPage).toHaveURL(/\/appointments$/);

    const professionalPage = await professionalContext.newPage();
    await login(professionalPage, owner);
    await professionalPage.getByRole("link", { name: "Notificações", exact: true }).click();
    await expect(professionalPage.getByText(`${serviceName} em ${shopName}`, { exact: true })).toBeVisible();
    const outsiderLogin = await request.post(`${api}/users/login`, { data: { email: outsider.email, password } });
    expect(outsiderLogin.status()).toBe(201);
    const outsiderNotifications = await request.get(`${api}/notifications`, { headers: { authorization: `Bearer ${(await outsiderLogin.json()).accessToken}` } });
    expect(outsiderNotifications.status()).toBe(200);
    expect((await outsiderNotifications.json()).data).toEqual([]);
  } finally {
    await customerContext.close();
    await professionalContext.close();
  }
});
