import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import type { Notification } from "../../src/types/notification.type";

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

type DatabaseModel = { deleteMany(input: { where: Record<string, unknown> }): Promise<unknown> };
type ReminderOutbox = { id: string; recipientIds: string[]; processedAt: Date | null; startsAt: Date };
type TestDatabase = {
  appointment: DatabaseModel & { update(input: Record<string, unknown>): Promise<unknown> };
  notificationOutbox: { findMany(input: Record<string, unknown>): Promise<ReminderOutbox[]> };
  barberSchedule: DatabaseModel;
  barberTimeOff: DatabaseModel;
  service: DatabaseModel;
  barberShop: DatabaseModel;
  user: DatabaseModel;
  $disconnect(): Promise<void>;
};

function createTestDatabase(): TestDatabase {
  const environment = parseEnv(readFileSync(resolve(apiDirectory, ".env.test"), "utf8"));
  if (environment.NODE_ENV !== "test" || new URL(environment.DATABASE_URL).searchParams.get("schema") !== "barber_api_test") {
    throw new Error("Fixtures de notificações recusadas fora de barber_api_test.");
  }
  const require = createRequire(resolve(apiDirectory, "package.json"));
  const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (options: { datasourceUrl: string }) => TestDatabase };
  return new PrismaClient({ datasourceUrl: environment.DATABASE_URL });
}

async function login(page: Page, account: { email: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(account.email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.afterAll(async () => {
  const database = createTestDatabase();
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

test("cron cria e entrega lembrete ao cliente desconectado, que o encontra ao abrir a aplicação", async ({ browser, request }) => {
  test.setTimeout(180_000);
  const reminderFixture = randomUUID();
  const professional = { name: "Profissional do lembrete", email: `barber-reminder-${reminderFixture}@example.test` };
  const customer = { name: "Cliente do lembrete", email: `client-reminder-${reminderFixture}@example.test` };
  const accountIds: Record<string, string> = {};
  for (const [account, role] of [[professional, "barber"], [customer, "client"]] as const) {
    const response = await request.post(`${api}/users`, { data: { ...account, password, role } });
    expect(response.status()).toBe(201);
    const id = (await response.json()).data.id;
    users.push(id);
    accountIds[role] = id;
  }

  const professionalLogin = await request.post(`${api}/users/login`, { data: { email: professional.email, password } });
  expect(professionalLogin.status()).toBe(201);
  const professionalAuthorization = `Bearer ${(await professionalLogin.json()).accessToken}`;
  const customerLogin = await request.post(`${api}/users/login`, { data: { email: customer.email, password } });
  expect(customerLogin.status()).toBe(201);
  const customerAuthorization = `Bearer ${(await customerLogin.json()).accessToken}`;
  const reminderShopName = `Barbearia lembrete ${reminderFixture}`;
  const reminderServiceName = `Corte lembrete ${reminderFixture}`;
  const shopResponse = await request.post(`${api}/barber-shops`, {
    headers: { authorization: professionalAuthorization },
    data: { name: reminderShopName, address: "Rua das Flores, 123, São Paulo - SP", timezone: "America/Sao_Paulo" },
  });
  expect(shopResponse.status()).toBe(201);
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 7);
  target.setUTCHours(12, 0, 0, 0);
  const schedule = await request.put(`${api}/appointments/availability/me/schedule`, {
    headers: { authorization: professionalAuthorization },
    data: { schedules: [{ dayOfWeek: target.getUTCDay(), startMinute: 540, endMinute: 1020 }] },
  });
  expect(schedule.status()).toBe(200);
  const serviceResponse = await request.post(`${api}/services`, {
    headers: { authorization: professionalAuthorization },
    data: { name: reminderServiceName, description: "Lembrete pelo cron real", price: 60, duration: 30 },
  });
  expect(serviceResponse.status()).toBe(201);
  const bookingResponse = await request.post(`${api}/appointments`, {
    headers: { authorization: customerAuthorization },
    data: { serviceId: (await serviceResponse.json()).data.id, barberId: accountIds.barber, date: target.toISOString() },
  });
  expect(bookingResponse.status()).toBe(201);
  const appointmentId = (await bookingResponse.json()).data.id;

  const database = createTestDatabase();
  const startsAt = new Date(Date.now() + 2 * 60 * 60_000);
  startsAt.setUTCSeconds(0, 0);
  try {
    const reminderWhere = { appointmentId, type: "appointment_reminder" };
    const reminderSelect = { id: true, recipientIds: true, processedAt: true, startsAt: true };
    expect(await database.notificationOutbox.findMany({ where: reminderWhere, select: reminderSelect })).toEqual([]);
    // Only this test's reservation is aged into the due window. The production
    // cron, publisher and worker must create and deliver the reminder themselves.
    await database.appointment.update({
      where: { id: appointmentId },
      data: { date: startsAt, endDate: new Date(startsAt.getTime() + 30 * 60_000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60_000) },
    });

    // No customer browser exists yet: reminder creation does not depend on an
    // open page or its 30-second polling timer. Allow one minute plus publication.
    await expect.poll(async () => {
      const response = await request.get(`${api}/notifications`, { headers: { authorization: customerAuthorization } });
      expect(response.status()).toBe(200);
      const notifications = (await response.json()).data as Notification[];
      return notifications.filter((item) => item.appointmentId === appointmentId && item.type === "appointment_reminder").length;
    }, { timeout: 75_000, intervals: [500, 1_000, 2_000] }).toBe(1);
    const events = await database.notificationOutbox.findMany({ where: reminderWhere, select: reminderSelect });
    expect(events).toHaveLength(1);
    expect(events[0].recipientIds).toEqual([accountIds.client]);
    expect(events[0].processedAt).not.toBeNull();
    expect(events[0].startsAt).toEqual(startsAt);
    const professionalNotifications = await request.get(`${api}/notifications`, { headers: { authorization: professionalAuthorization } });
    expect(professionalNotifications.status()).toBe(200);
    expect(((await professionalNotifications.json()).data as Notification[]).filter((item) => item.appointmentId === appointmentId && item.type === "appointment_reminder")).toEqual([]);
  } finally { await database.$disconnect(); }

  const customerContext = await browser.newContext({ timezoneId: "UTC" });
  try {
    const page = await customerContext.newPage();
    await login(page, customer);
    await page.getByRole("link", { name: "Notificações", exact: true }).click();
    const reminder = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Lembrete de agendamento", exact: true }) });
    await expect(reminder).toHaveCount(1);
    await expect(reminder.getByText(`${reminderServiceName} em ${reminderShopName}`, { exact: true })).toBeVisible();
    await expect(reminder.locator("time")).toHaveAttribute("datetime", startsAt.toISOString());
    await expect(reminder.locator("time")).toHaveText(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(startsAt));
    await expect(reminder.getByText("Não lida", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Agendamento confirmado", exact: true })).toBeVisible();
  } finally { await customerContext.close(); }
});

test("confirmação, alteração, cancelamento e leitura atravessam API, worker e caixas corretas", async ({ browser, request }) => {
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
    const bookingResponse = await booked;
    expect(bookingResponse.status()).toBe(201);
    const appointmentId = (await bookingResponse.json()).data.id;

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

    const changedServiceName = `Barba confirmação ${fixture}`;
    const changedService = await request.post(`${api}/services`, {
      headers: { authorization }, data: { name: changedServiceName, description: "Alteração por fila", price: 40, duration: 30 },
    });
    expect(changedService.status()).toBe(201);
    const newDate = new Date(target.getTime() + 3_600_000).toISOString();
    const rescheduled = await request.put(`${api}/appointments/${appointmentId}`, {
      headers: { authorization }, data: { date: newDate, serviceId: (await changedService.json()).data.id },
    });
    expect(rescheduled.status()).toBe(200);
    await expect.poll(async () => {
      const response = await request.get(`${api}/notifications`, { headers: { authorization: `Bearer ${clientToken}` } });
      return (await response.json()).data.filter((item: { type: string }) => item.type === "appointment_updated").length;
    }, { timeout: 20_000 }).toBe(1);
    await customerPage.getByRole("link", { name: "Notificações", exact: true }).click();
    const changed = customerPage.getByRole("listitem").filter({ has: customerPage.getByRole("heading", { name: "Agendamento alterado", exact: true }) });
    await expect(changed.getByText(serviceName, { exact: true })).toBeVisible();
    await expect(changed.getByText(changedServiceName, { exact: true })).toBeVisible();
    await expect(changed.locator("time").first()).toContainText("09:00");
    await expect(changed.locator("time").last()).toContainText("10:00");
    const marked = customerPage.waitForResponse((response) => response.request().method() === "PATCH" && new URL(response.url()).pathname.endsWith("/read"));
    await changed.getByRole("button", { name: "Marcar como lida", exact: true }).click();
    const markedResponse = await marked;
    expect(markedResponse.status()).toBe(200);
    const readNotification = (await markedResponse.json()).data;
    await expect(changed.getByText("Lida", { exact: true })).toBeVisible();
    await expect(customerPage.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("1 notificação não lida.");
    const repeatedRead = await request.patch(`${api}/notifications/${readNotification.id}/read`, { headers: { authorization: `Bearer ${clientToken}` } });
    expect(repeatedRead.status()).toBe(200);
    expect((await repeatedRead.json()).data.readAt).toBe(readNotification.readAt);
    const otherReader = await request.patch(`${api}/notifications/${readNotification.id}/read`, { headers: { authorization } });
    expect(otherReader.status()).toBe(404);

    const cancellation = await request.patch(`${api}/appointments/${appointmentId}`, { headers: { authorization }, data: { newStatus: "cancelled" } });
    expect(cancellation.status()).toBe(200);
    await expect.poll(async () => {
      const response = await request.get(`${api}/notifications`, { headers: { authorization: `Bearer ${clientToken}` } });
      return (await response.json()).data.filter((item: { type: string }) => item.type === "appointment_cancelled").length;
    }, { timeout: 20_000 }).toBe(1);
    await customerPage.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(customerPage.getByRole("heading", { name: "Agendamento cancelado", exact: true })).toBeVisible();
    await expect(customerPage.getByRole("heading", { name: "Agendamento confirmado", exact: true })).toBeVisible();
    await professionalPage.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(professionalPage.getByRole("heading", { name: "Agendamento alterado", exact: true })).toBeVisible();
    await expect(professionalPage.getByRole("heading", { name: "Agendamento cancelado", exact: true })).toHaveCount(0);
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
