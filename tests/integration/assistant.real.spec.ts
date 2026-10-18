import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const api = "http://127.0.0.1:3002/api/v1";
const apiDirectory = resolve(
  process.env.BARBER_API_DIR ?? "../Projeto_Barber_API",
);
const fixture = randomUUID();
const password = randomUUID();
const users: string[] = [];
const owner = {
  email: `assistant-owner-${fixture}@example.test`,
  name: "Dono simulador integração",
};
const client = {
  email: `assistant-client-${fixture}@example.test`,
  name: "Cliente simulador integração",
};
const shopName = `Simulador integração ${fixture}`;
const serviceName = `Corte ${fixture}`;
const target = new Date();
target.setUTCDate(target.getUTCDate() + 7);
target.setUTCHours(12, 0, 0, 0);
const day = target.toISOString().slice(0, 10);
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
let shopId: string;
let serviceId: string;
let appointmentId: string;
let clientToken: string;

type AssistantResponse = {
  answer: string;
  provider: "simulated";
  toolCalls: {
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }[];
};
type Availability = {
  date: string;
  serviceId: string;
  timezone: string;
  slots: { startsAt: string; endsAt: string }[];
};

async function apiLogin(
  request: APIRequestContext,
  account: { email: string },
) {
  const response = await request.post(`${api}/users/login`, {
    data: { email: account.email, password },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).accessToken as string;
}

async function ask(page: Page, message: string): Promise<AssistantResponse> {
  await page.getByLabel("Sua pergunta").fill(message);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/v1/assistant/chat",
  );
  await page
    .getByRole("button", { name: "Enviar pergunta", exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const result = (await response.json()).data as AssistantResponse;
  expect(result.provider).toBe("simulated");
  await expect(
    page.locator("article").last().getByText(result.answer, { exact: true }),
  ).toBeVisible();
  return result;
}

test.beforeAll(async ({ request }) => {
  for (const [account, role] of [
    [owner, "barber"],
    [client, "client"],
  ] as const) {
    const response = await request.post(`${api}/users`, {
      data: { ...account, password, role },
    });
    expect(response.status()).toBe(201);
    users.push((await response.json()).data.id);
  }
  const ownerToken = await apiLogin(request, owner);
  const shop = await request.post(`${api}/barber-shops`, {
    headers: headers(ownerToken),
    data: {
      name: shopName,
      address: "Rua Simulador, 123, Sao Paulo - SP",
      timezone: "America/Sao_Paulo",
    },
  });
  expect(shop.status()).toBe(201);
  shopId = (await shop.json()).data.id;
  const service = await request.post(`${api}/services`, {
    headers: headers(ownerToken),
    data: {
      name: serviceName,
      description: "Serviço real para consultas do simulador",
      duration: 30,
      price: 47,
    },
  });
  expect(service.status()).toBe(201);
  serviceId = (await service.json()).data.id;
  const schedule = await request.put(
    `${api}/appointments/availability/me/schedule`,
    {
      headers: headers(ownerToken),
      data: {
        schedules: [
          { dayOfWeek: target.getUTCDay(), startMinute: 540, endMinute: 660 },
        ],
      },
    },
  );
  expect(schedule.status()).toBe(200);
  clientToken = await apiLogin(request, client);
  // An occupied slot proves the assistant reads actual persisted availability.
  // Its unchanged status later also detects accidental cancellation by chat.
  const appointment = await request.post(`${api}/appointments`, {
    headers: headers(clientToken),
    data: { serviceId, date: `${day}T12:30:00.000Z` },
  });
  expect(appointment.status()).toBe(201);
  appointmentId = (await appointment.json()).data.id;
});

test.afterAll(async () => {
  // Cleanup is limited to this fixture and cannot target the development schema.
  const environment = parseEnv(
    readFileSync(resolve(apiDirectory, ".env.test"), "utf8"),
  );
  const databaseUrl = environment.DATABASE_URL;
  if (
    environment.NODE_ENV !== "test" ||
    typeof databaseUrl !== "string" ||
    new URL(databaseUrl).searchParams.get("schema") !== "barber_api_test"
  ) {
    throw new Error("Cleanup do simulador recusado fora de barber_api_test.");
  }
  type Model = {
    deleteMany(input: { where: Record<string, unknown> }): Promise<unknown>;
  };
  type Database = {
    appointment: Model;
    barberTimeOff: Model;
    barberSchedule: Model;
    service: Model;
    barberShop: Model;
    user: Model;
    $disconnect(): Promise<void>;
  };
  const require = createRequire(resolve(apiDirectory, "package.json"));
  const { PrismaClient } = require("@prisma/client") as {
    PrismaClient: new (options: { datasourceUrl: string }) => Database;
  };
  const database = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await database.appointment.deleteMany({
      where: { OR: [{ clientId: { in: users } }, { barberId: { in: users } }] },
    });
    await database.barberTimeOff.deleteMany({
      where: { barberId: { in: users } },
    });
    await database.barberSchedule.deleteMany({
      where: { barberId: { in: users } },
    });
    await database.service.deleteMany({
      where: { barberShop: { ownerId: { in: users } } },
    });
    await database.barberShop.deleteMany({ where: { ownerId: { in: users } } });
    await database.user.deleteMany({ where: { id: { in: users } } });
  } finally {
    await database.$disconnect();
  }
});

test("simulated assistant consults real services and shop-local availability without creating or cancelling reservations", async ({
  page,
  request,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(client.email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
  await page
    .getByRole("menuitem", { name: "Assistente experimental", exact: true })
    .click();
  await expect(page.getByText("Modo simulado", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Não realiza agendamentos nem cancelamentos/),
  ).toBeVisible();
  expect(
    await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
  ).toBe("UTC");

  await page.getByLabel("Barbearia", { exact: true }).selectOption(shopId);
  await page.getByLabel("Serviço", { exact: true }).selectOption(serviceId);
  await page.getByLabel("Data", { exact: true }).fill(day);
  const services = await ask(
    page,
    "Quais serviços e preços esta barbearia oferece?",
  );
  expect(services.toolCalls).toHaveLength(1);
  expect(services.toolCalls[0]).toMatchObject({
    name: "list_services",
    arguments: { barberShopId: shopId },
    result: {
      total: 1,
      items: [
        {
          id: serviceId,
          name: serviceName,
          price: 47,
          duration: 30,
          barberShopId: shopId,
        },
      ],
    },
  });
  expect(services.answer).toContain(serviceName);
  expect(services.answer).toContain("47,00");
  await page
    .locator("article")
    .last()
    .getByText("Fontes consultadas", { exact: true })
    .click();
  await expect(
    page
      .locator("article")
      .last()
      .getByRole("heading", { name: "Serviços", exact: true }),
  ).toBeVisible();

  const direct = await request.get(
    `${api}/barber-shops/${shopId}/availability`,
    {
      headers: headers(clientToken),
      params: { serviceId, date: day },
    },
  );
  expect(direct.status()).toBe(200);
  const expectedAvailability = (await direct.json()).data as Availability;
  expect(expectedAvailability.timezone).toBe("America/Sao_Paulo");
  expect(expectedAvailability.slots.map((slot) => slot.startsAt)).toEqual([
    `${day}T12:00:00.000Z`,
    `${day}T13:00:00.000Z`,
    `${day}T13:30:00.000Z`,
  ]);
  const availability = await ask(page, "Quais horários estão disponíveis?");
  expect(availability.toolCalls).toEqual([
    {
      name: "get_availability",
      arguments: { barberShopId: shopId, serviceId, date: day },
      result: expectedAvailability,
    },
  ]);
  expect(availability.answer).toContain("America/Sao_Paulo");
  for (const hour of ["09:00", "10:00", "10:30"])
    expect(availability.answer).toContain(hour);
  expect(availability.answer).not.toContain("09:30");
  expect(availability.answer).not.toContain("12:00");
  const availabilityArticle = page.locator("article").last();
  await availabilityArticle
    .getByText("Fontes consultadas", { exact: true })
    .click();
  await expect(
    availabilityArticle.getByRole("heading", {
      name: "Disponibilidade",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    availabilityArticle
      .locator("pre")
      .filter({ hasText: `${day}T12:00:00.000Z` }),
  ).toBeVisible();

  const refused = await ask(
    page,
    "Agende um corte às 10:00 e cancele minha reserva existente.",
  );
  expect(refused.toolCalls).toEqual([]);
  expect(refused.answer).toContain("Não realizo reservas");
  const appointments = await request.get(`${api}/appointments`, {
    headers: headers(clientToken),
  });
  expect(appointments.status()).toBe(200);
  expect((await appointments.json()).data).toMatchObject([
    {
      id: appointmentId,
      status: "scheduled",
      date: `${day}T12:30:00.000Z`,
      serviceId,
      barberShopId: shopId,
    },
  ]);
  const remaining = await request.get(
    `${api}/barber-shops/${shopId}/availability`,
    {
      headers: headers(clientToken),
      params: { serviceId, date: day },
    },
  );
  expect(remaining.status()).toBe(200);
  expect((await remaining.json()).data).toEqual(expectedAvailability);
  expect(pageErrors).toEqual([]);
});
