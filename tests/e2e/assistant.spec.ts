import { expect, test, type Page, type Route } from "@playwright/test";

const shopId = "10000000-0000-4000-8000-000000000001";
const serviceId = "20000000-0000-4000-8000-000000000001";
const reply = {
  data: {
    answer:
      "Consulta real: Corte disponível às 10:30 no fuso America/Sao_Paulo.",
    provider: "simulated",
    toolCalls: [
      {
        name: "get_availability",
        arguments: { barberShopId: shopId, serviceId, date: "2026-12-01" },
        result: {
          timezone: "America/Sao_Paulo",
          slots: [{ startsAt: "2026-12-01T13:30:00Z" }],
        },
      },
    ],
  },
};
const respond = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
async function login(page: Page, email = "a@example.test") {
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(email);
  await page.getByPlaceholder("••••••••").fill("Password2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Assistente", exact: true }).click();
}
async function ask(page: Page, message = "Quais horários estão disponíveis?") {
  await page.getByLabel("Sua pergunta").fill(message);
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/users/login"))
      return respond(route, 201, {
        accessToken: route.request().postDataJSON().email,
      });
    if (path.endsWith("/users/me"))
      return respond(route, 200, {
        data: {
          id: "user-a",
          name: "Pessoa",
          role: "client",
          ownedBarberShops: [],
        },
      });
    if (path.endsWith("/barber-shops"))
      return respond(route, 200, {
        data: [{ id: shopId, name: "Barbearia Estudo", address: "Rua Estudo" }],
        meta: { total: 1, currentPage: 1, lastPage: 1, perPage: 50 },
      });
    if (path.endsWith("/services"))
      return respond(route, 200, {
        data: [
          {
            id: serviceId,
            barberShopId: shopId,
            name: "Corte",
            duration: 30,
            price: 40,
          },
        ],
        meta: { lastPage: 1 },
      });
    if (path.endsWith("/assistant/chat")) return respond(route, 200, reply);
    return respond(route, 200, { data: [], meta: { lastPage: 1 } });
  });
});

test("assistant requires authentication and identifies its simulated read-only behavior", async ({
  page,
}) => {
  await page.goto("/assistant");
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Assistente de consultas" }),
  ).toBeVisible();
  await expect(page.getByText("Modo simulado", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Não realiza agendamentos nem cancelamentos/),
  ).toBeVisible();
  await expect(
    page.getByText(/Cada pergunta usa somente o contexto selecionado/),
  ).toBeVisible();
});

test("sends selected context without history and displays only the returned answer and sources", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Barbearia", { exact: true }).selectOption(shopId);
  await page.getByLabel("Serviço", { exact: true }).selectOption(serviceId);
  await page.getByLabel("Data", { exact: true }).fill("2026-12-01");
  const request = page.waitForRequest("**/assistant/chat");
  await ask(page);
  expect((await request).postDataJSON()).toEqual({
    message: "Quais horários estão disponíveis?",
    context: { barberShopId: shopId, serviceId, date: "2026-12-01" },
  });
  await expect(
    page.getByText(reply.data.answer, { exact: true }),
  ).toBeVisible();
  await page.getByText("Fontes consultadas", { exact: true }).click();
  await expect(
    page.getByText("Disponibilidade", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: "2026-12-01T13:30:00Z" }),
  ).toBeVisible();
  await page.getByLabel("Barbearia", { exact: true }).selectOption("");
  await expect(page.getByLabel("Serviço", { exact: true })).toHaveValue("");
});

test("pending prevents duplicate requests and errors preserve the question for retry", async ({
  page,
}) => {
  await login(page);
  const held = deferred();
  let requests = 0;
  await page.route("**/assistant/chat", async (route) => {
    requests++;
    await held.promise;
    return respond(route, 500, { message: "Internal error" });
  });
  try {
    await ask(page);
    await expect.poll(() => requests).toBe(1);
    await expect(
      page.getByRole("button", { name: "Consultando…" }),
    ).toBeDisabled();
    await page.getByLabel("Sua pergunta").press("Control+Enter");
    expect(requests).toBe(1);
  } finally {
    held.resolve();
  }
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível consultar",
  );
  await expect(page.getByLabel("Sua pergunta")).toHaveValue(
    "Quais horários estão disponíveis?",
  );
  await page.unroute("**/assistant/chat");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(
    page.getByText(reply.data.answer, { exact: true }),
  ).toBeVisible();
});

test("logout and another account do not retain history, context or a delayed old response", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Barbearia", { exact: true }).selectOption(shopId);
  const held = deferred();
  const started = deferred();
  await page.route("**/assistant/chat", async (route) => {
    started.resolve();
    await held.promise;
    try {
      await respond(route, 200, reply);
    } catch {
      /* Request can be aborted on logout. */
    }
  });
  await ask(page, "Pergunta privada da conta A");
  await started.promise;
  try {
    await page.getByRole("button", { name: "Perfil", exact: true }).click();
    await page.getByRole("menuitem", { name: "Sair", exact: true }).click();
    await login(page, "b@example.test");
  } finally {
    held.resolve();
  }
  await expect(
    page.getByText("Pergunta privada da conta A", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(reply.data.answer, { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Barbearia", { exact: true })).toHaveValue("");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    "token",
  ]);
});

test("untrusted answer and tool strings are plain text without executable markup", async ({
  page,
}) => {
  await page.route("**/assistant/chat", (route) =>
    respond(route, 200, {
      data: {
        answer: '<img src=x onerror="window.hacked=true">',
        provider: "simulated",
        toolCalls: [
          {
            name: "search_catalog",
            arguments: { query: "<script>alert(1)</script>" },
            result: { data: [{ name: "<img src=x onerror=alert(1)>" }] },
          },
        ],
      },
    }),
  );
  await login(page);
  await ask(page, "Catálogo");
  await expect(
    page.getByText('<img src=x onerror="window.hacked=true">', { exact: true }),
  ).toBeVisible();
  await page.getByText("Fontes consultadas", { exact: true }).click();
  await expect(page.locator("main img")).toHaveCount(0);
  expect(await page.evaluate(() => "hacked" in window)).toBe(false);
});

test("mobile navigation exposes assistant and question length is limited", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await expect(page.getByLabel("Sua pergunta")).toHaveAttribute(
    "maxlength",
    "1000",
  );
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(page.getByLabel("Sua pergunta")).toBeFocused();
  expect(
    await page
      .getByLabel("Sua pergunta")
      .evaluate((input: HTMLTextAreaElement) => input.validity.valueMissing),
  ).toBe(true);
  await page.screenshot({
    path: "output/playwright/assistant-mobile.png",
    fullPage: true,
  });
});
