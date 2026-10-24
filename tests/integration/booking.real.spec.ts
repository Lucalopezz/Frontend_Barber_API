import { test, expect, type Page } from "@playwright/test";
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
  email: `owner-${fixture}@example.test`,
  name: "Owner integração",
};
const client = {
  email: `client-${fixture}@example.test`,
  name: "Cliente integração",
};
const otherClient = {
  email: `other-${fixture}@example.test`,
  name: "Outro cliente integração",
};
const shopName = `Barbearia integração ${fixture}`;
const target = new Date();
target.setUTCDate(target.getUTCDate() + 7);
target.setUTCHours(12, 0, 0, 0);
const day = target.toISOString().slice(0, 10);
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const responseFor =
  (method: string, path: string) =>
  (response: { request(): { method(): string }; url(): string }) =>
    response.request().method() === method &&
    new URL(response.url()).pathname === `/api/v1${path}`;

async function login(page: Page, account: { email: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(account.email);
  await page.locator('input[type="password"]').fill(password);
  await page
    .locator("form")
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
}

async function chooseSlot(
  page: Page,
  shopId: string,
  serviceId: string,
  hour: string,
) {
  await page.goto(`/book/${shopId}`);
  await page.getByLabel("Serviço", { exact: true }).selectOption(serviceId);
  await expect(page.getByLabel("Profissional", { exact: true })).not.toHaveValue("");
  await page.getByLabel("Data", { exact: true }).fill(day);
  await page.getByRole("button", { name: hour, exact: true }).click();
}

async function bookThroughUi(page: Page) {
  const response = page.waitForResponse(responseFor("POST", "/appointments"));
  await page
    .getByRole("button", { name: "Confirmar agendamento", exact: true })
    .click();
  const result = await response;
  expect(result.status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("Agendamento criado.");
  return (await result.json()).data as { id: string; date: string };
}

test.beforeAll(async ({ request }) => {
  for (const [account, role] of [
    [owner, "barber"],
    [client, "client"],
    [otherClient, "client"],
  ] as const) {
    const result = await request.post(`${api}/users`, {
      data: { ...account, password, role },
    });
    expect(result.status()).toBe(201);
    users.push((await result.json()).data.id);
  }
});

test.afterAll(async () => {
  // Only this fixture's IDs are removed, and only from the isolated test schema.
  const environment = parseEnv(
    readFileSync(resolve(apiDirectory, ".env.test"), "utf8"),
  );
  if (
    environment.NODE_ENV !== "test" ||
    new URL(environment.DATABASE_URL).searchParams.get("schema") !==
      "barber_api_test"
  ) {
    throw new Error("Cleanup de integração recusado fora de barber_api_test.");
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
  const database = new PrismaClient({
    datasourceUrl: environment.DATABASE_URL,
  });
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

test("owner configures availability and clients book/cancel with real API, database, roles and conflicts", async ({
  browser,
  request,
}) => {
  const errors: string[] = [];
  const ownerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:5175",
    timezoneId: "UTC",
  });
  const ownerPage = await ownerContext.newPage();
  const clientContext = await browser.newContext({
    baseURL: "http://127.0.0.1:5175",
    timezoneId: "UTC",
  });
  const clientPage = await clientContext.newPage();
  for (const page of [ownerPage, clientPage])
    page.on("pageerror", (error) => errors.push(error.message));
  try {
    await login(ownerPage, owner);
    const originalToken = await ownerPage.evaluate(async () =>
      (await import('/src/auth/session.ts')).getAccessToken(),
    );
    expect(originalToken).toBeTruthy();
    expect(await ownerPage.evaluate(() => localStorage.getItem('token'))).toBeNull();
    const refreshCookie=(await ownerContext.cookies()).find(cookie=>cookie.name.startsWith('barber_refresh_'));
    expect(refreshCookie?.httpOnly).toBe(true);
    await ownerPage
      .getByRole("button", { name: "Criar Loja", exact: true })
      .click();
    await ownerPage.getByPlaceholder("Nome da loja").fill(shopName);
    await ownerPage
      .getByLabel("Logradouro", { exact: true })
      .fill("Rua Integração");
    await ownerPage.getByLabel("Número", { exact: true }).fill("123");
    await ownerPage.getByLabel("Cidade", { exact: true }).fill("Sao Paulo");
    await ownerPage.getByLabel("Estado (UF)", { exact: true }).fill("SP");
    const shopResponse = ownerPage.waitForResponse(
      responseFor("POST", "/barber-shops"),
    );
    await ownerPage
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    const shopResult = await shopResponse;
    expect(shopResult.status()).toBe(201);
    const shopId = (await shopResult.json()).data.id as string;
    await ownerPage
      .getByRole("link", { name: "Gerenciar Barbearia", exact: true })
      .click();
    await ownerPage.getByRole("navigation", { name: "Gestão da barbearia" }).getByRole("link", { name: "Serviços" }).click();

    await ownerPage
      .getByPlaceholder("Corte masculino")
      .fill("Corte integração");
    await ownerPage.locator('input[name="price"]').fill("50");
    await ownerPage.locator('input[name="duration"]').fill("30");
    await ownerPage
      .getByPlaceholder("Descreva o serviço")
      .fill("Serviço da jornada real");
    const serviceResponse = ownerPage.waitForResponse(
      responseFor("POST", "/services"),
    );
    await ownerPage
      .getByRole("button", { name: "Criar Serviço", exact: true })
      .click();
    const serviceResult = await serviceResponse;
    expect(serviceResult.status()).toBe(201);
    const serviceId = (await serviceResult.json()).data.id as string;
    expect(
      (await ownerPage.evaluate(async () => (await import("/src/auth/session.ts")).getAccessToken())) ===
        originalToken,
    ).toBe(true);

    await ownerPage.goto("/availability");
    await ownerPage
      .getByRole("button", { name: "Adicionar intervalo", exact: true })
      .click();
    await ownerPage
      .getByLabel("Dia da semana 1", { exact: true })
      .selectOption(String(target.getUTCDay()));
    await ownerPage
      .getByLabel("Início expediente 1", { exact: true })
      .fill("09:00");
    await ownerPage
      .getByLabel("Fim expediente 1", { exact: true })
      .fill("12:00");
    await ownerPage
      .getByRole("button", { name: "Salvar expediente", exact: true })
      .click();
    await expect(
      ownerPage.getByRole("status"),
    ).toContainText("Expediente salvo.");
    await ownerPage.getByRole("tab", { name: "Folgas" }).click();

    await ownerPage
      .getByLabel("Início da folga", { exact: true })
      .fill(`${day}T09:00`);
    await ownerPage
      .getByLabel("Fim da folga", { exact: true })
      .fill(`${day}T10:00`);
    await ownerPage
      .getByLabel("Motivo da folga", { exact: true })
      .fill("Folga de integração");
    const timeOffResponse = ownerPage.waitForResponse(
      responseFor("POST", "/appointments/availability/me/time-offs"),
    );
    await ownerPage
      .getByRole("button", { name: "Adicionar folga", exact: true })
      .click();
    const timeOffResult = await timeOffResponse;
    expect(timeOffResult.status()).toBe(201);
    expect((await timeOffResult.json()).data.startsAt).toBe(
      `${day}T12:00:00.000Z`,
    );

    await login(clientPage, client);
    await clientPage
      .getByRole("textbox", { name: "Buscar barbearia" })
      .fill(shopName);
    await clientPage
      .getByRole("button", { name: "Agendar", exact: true })
      .click();
    await clientPage
      .getByLabel("Serviço", { exact: true })
      .selectOption(serviceId);
    await clientPage.getByLabel("Data", { exact: true }).fill(day);
    await expect(
      clientPage.getByRole("button", { name: "10:00", exact: true }),
    ).toBeVisible();
    await expect(
      clientPage.getByRole("button", { name: "09:00", exact: true }),
    ).toHaveCount(0);
    await ownerPage.getByRole("button", { name: /^Remover folga / }).click();
    await expect(
      ownerPage.getByRole("status"),
    ).toContainText("Folga removida.");

    await chooseSlot(clientPage, shopId, serviceId, "09:00");
    const otherLogin = await request.post(`${api}/users/login`, {
      data: { email: otherClient.email, password },
    });
    const otherToken = (await otherLogin.json()).accessToken as string;
    const concurrent = await request.post(`${api}/appointments`, {
      headers: headers(otherToken),
      data: { serviceId, date: `${day}T12:00:00.000Z` },
    });
    expect(concurrent.status()).toBe(201);
    const concurrentId = (await concurrent.json()).data.id as string;
    const conflictResponse = clientPage.waitForResponse(
      responseFor("POST", "/appointments"),
    );
    await clientPage
      .getByRole("button", { name: "Confirmar agendamento", exact: true })
      .click();
    expect((await conflictResponse).status()).toBe(409);
    await expect(clientPage.getByRole("alert")).toContainText(
      "Horário indisponível",
    );
    await expect(
      clientPage.getByRole("button", { name: "09:00", exact: true }),
    ).toHaveCount(0);
    expect(
      (
        await request.patch(`${api}/appointments/${concurrentId}`, {
          headers: headers(otherToken),
          data: { newStatus: "cancelled" },
        })
      ).status(),
    ).toBe(200);

    await chooseSlot(clientPage, shopId, serviceId, "09:00");
    const first = await bookThroughUi(clientPage);
    expect(first.date).toBe(`${day}T12:00:00.000Z`);
    expect(
      (
        await request.get(`${api}/appointments/${first.id}`, {
          headers: headers(otherToken),
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.patch(`${api}/appointments/${first.id}`, {
          headers: headers(otherToken),
          data: { newStatus: "cancelled" },
        })
      ).status(),
    ).toBe(403);
    await clientPage
      .getByRole("link", { name: "Ver agendamentos", exact: true })
      .click();
    await clientPage
      .getByRole("button", { name: "Cancelar", exact: true })
      .click();
    const cancelResponse = clientPage.waitForResponse(
      responseFor("PATCH", `/appointments/${first.id}`),
    );
    await clientPage
      .getByRole("button", { name: "Confirmar cancelamento", exact: true })
      .click();
    expect((await cancelResponse).status()).toBe(200);
    await expect(
      clientPage.getByText("Cancelado", { exact: true }),
    ).toBeVisible();
    await expect(
      clientPage.getByRole("button", { name: "Cancelar", exact: true }),
    ).toHaveCount(0);

    await chooseSlot(clientPage, shopId, serviceId, "10:00");
    const second = await bookThroughUi(clientPage);
    await ownerPage.goto("/appointments");
    await ownerPage
      .getByRole("button", { name: "Remarcar", exact: true })
      .click();
    await ownerPage.getByLabel("Data", { exact: true }).fill(day);
    await ownerPage.getByRole("button", { name: "11:00", exact: true }).click();
    const reschedule = ownerPage.waitForResponse(
      responseFor("PUT", `/appointments/${second.id}`),
    );
    await ownerPage
      .getByRole("button", { name: "Confirmar remarcação", exact: true })
      .click();
    expect((await reschedule).status()).toBe(200);
    const complete = ownerPage.waitForResponse(
      responseFor("PATCH", `/appointments/${second.id}`),
    );
    await ownerPage
      .getByRole("button", { name: "Concluir", exact: true })
      .click();
    expect((await complete).status()).toBe(200);
    await expect(
      ownerPage.getByText("Concluído", { exact: true }),
    ).toBeVisible();
    await expect(
      ownerPage.getByRole("button", { name: "Concluir", exact: true }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await ownerContext.close();
    await clientContext.close();
  }
});
