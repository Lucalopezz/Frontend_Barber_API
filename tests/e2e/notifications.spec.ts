import { expect, test, type Page, type Route } from "@playwright/test";
import { mockSession, sessionTokens } from "./session-fixture";

test.use({ timezoneId: "UTC" });

const notice = {
  id: "notice-1",
  appointmentId: "appointment-1",
  type: "appointment_created",
  serviceName: "Corte",
  barberShopName: "Barbearia Escola",
  startsAt: "2030-01-07T12:00:00.000Z",
  timezone: "America/Sao_Paulo",
  createdAt: "2030-01-01T12:00:00.000Z",
  readAt: null,
};

function collection(items = [notice], page = 1, total = items.length, lastPage = 1) {
  return { data: items, meta: { currentPage: page, perPage: 15, lastPage, total } };
}

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

async function mockNotifications(page: Page, respond: (route: Route) => Promise<unknown>) {
  await mockSession(page, "notification-session");
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (path.endsWith("/users/me")) return route.fulfill({ json: { data: { id: "client-1", name: "Cliente", role: "client" } } });
    if (path.endsWith("/notifications")) return respond(route);
    return route.fulfill({ json: collection([]) });
  });
}

test("mostra a confirmação no fuso da barbearia e abre a agenda", async ({ page }) => {
  await mockNotifications(page, (route) => route.fulfill({ json: collection() }));
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Agendamento confirmado" })).toBeVisible();
  await expect(page.getByText("Corte em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(page.locator("time")).toHaveText("07/01/2030, 09:00");
  await expect(page.getByText("Horário da barbearia", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver na agenda" }).click();
  await expect(page).toHaveURL(/\/appointments$/);
});

test("navega pelas páginas e solicita somente a página selecionada", async ({ page }) => {
  const requested: number[] = [];
  await mockNotifications(page, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page"));
    expect(url.searchParams.get("perPage")).toBe("15");
    requested.push(pageNumber);
    return route.fulfill({ json: collection([{ ...notice, id: `notice-${pageNumber}`, serviceName: pageNumber === 1 ? "Primeiro corte" : "Segundo corte" }], pageNumber, 16, 2) });
  });
  await page.goto("/notifications");
  const pagination = page.getByRole("navigation", { name: "Páginas de notificações" });
  await expect(pagination.getByRole("button", { name: "Anterior" })).toBeDisabled();
  await pagination.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("Segundo corte em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(page.getByText("Primeiro corte em Barbearia Escola", { exact: true })).toHaveCount(0);
  await expect(pagination).toContainText("Página 2 de 2");
  await expect(pagination.getByRole("button", { name: "Próxima" })).toBeDisabled();
  await pagination.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByText("Primeiro corte em Barbearia Escola", { exact: true })).toBeVisible();
  await expect.poll(() => requested).toEqual([1, 2, 1]);
});

test("distingue carregamento de caixa vazia", async ({ page }) => {
  const pending = barrier();
  await mockNotifications(page, async (route) => {
    await pending.promise;
    return route.fulfill({ json: collection([]) });
  });
  await page.goto("/notifications");
  await expect(page.getByRole("status")).toHaveText("Carregando notificações…");
  await expect(page.getByRole("button", { name: "Atualizar", exact: true })).toBeDisabled();
  await expect(page.getByText("Nenhuma notificação por enquanto", { exact: true })).toHaveCount(0);
  pending.release();
  await expect(page.getByRole("heading", { name: "Nenhuma notificação por enquanto" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("mostra falha com nova tentativa sem apresentá-la como caixa vazia", async ({ page }) => {
  let recovered = false;
  await mockNotifications(page, (route) => recovered
    ? route.fulfill({ json: collection() })
    : route.fulfill({ status: 403, json: { message: "Forbidden" } }));
  await page.goto("/notifications");
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar suas notificações.");
  await expect(page.getByText("Nenhuma notificação por enquanto", { exact: true })).toHaveCount(0);
  recovered = true;
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByText("Corte em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("preserva a última consulta e informa falha ao atualizar", async ({ page }) => {
  let requests = 0;
  await mockNotifications(page, (route) => ++requests === 1
    ? route.fulfill({ json: collection() })
    : route.fulfill({ status: 403, json: { message: "Forbidden" } }));
  await page.goto("/notifications");
  await expect(page.getByText("Corte em Barbearia Escola", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mostrando a última consulta.");
  await expect(page.getByText("Corte em Barbearia Escola", { exact: true })).toBeVisible();
});

test("acesso anônimo não consulta notificações e redireciona para entrar", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/notifications")) requests++;
    return route.fulfill({ status: 401, json: { code: "AUTH_SESSION_INVALID" } });
  });
  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/login$/);
  expect(requests).toBe(0);
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveCount(0);
});

test("não reutiliza confirmação nem resposta atrasada da conta anterior", async ({ page }) => {
  const sidA = "11111111-1111-4111-8111-111111111111";
  const sidB = "22222222-2222-4222-8222-222222222222";
  let current: "a" | "b" = "a";
  let requestsA = 0;
  const reached = barrier();
  const resume = barrier();
  const staleSettled = barrier();
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/logout")) return route.fulfill({ status: 204 });
    if (path.endsWith("/users/login")) current = "b";
    if (path.endsWith("/auth/refresh") || path.endsWith("/users/login")) return route.fulfill({ json: sessionTokens(`account-${current}`, current === "a" ? sidA : sidB) });
    if (path.endsWith("/users/me")) return route.fulfill({ json: { data: { id: current, name: current, role: "client" } } });
    if (path.endsWith("/notifications")) {
      const identity = route.request().headers().authorization === "Bearer account-a" ? "a" : "b";
      if (identity === "a" && ++requestsA === 2) { reached.release(); await resume.promise; }
      await route.fulfill({ json: collection([{ ...notice, serviceName: identity === "a" ? "Corte conta A" : "Barba conta B" }]) }).catch(() => { /* The old identity request is canceled. */ });
      if (identity === "a" && requestsA === 2) staleSettled.release();
      return;
    }
    return route.fulfill({ json: collection([]) });
  });
  await page.goto("/notifications");
  await expect(page.getByText("Corte conta A em Barbearia Escola", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await reached.promise;
  await page.evaluate(async () => {
    const { loginSession } = await import("/src/auth/session.ts");
    await loginSession({ email: "b@example.test", password: "Password2026!" });
  });
  await page.getByRole("link", { name: "Notificações", exact: true }).click();
  await expect(page.getByText("Barba conta B em Barbearia Escola", { exact: true })).toBeVisible();
  resume.release();
  await staleSettled.promise;
  await expect(page.getByText("Corte conta A em Barbearia Escola", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Barba conta B em Barbearia Escola", { exact: true })).toBeVisible();
});

test("abre pelo sino no celular e comporta nomes longos sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await mockNotifications(page, (route) => route.fulfill({ json: collection([{ ...notice, barberShopName: "Barbearia do bairro com um nome bastante longo para conferir a leitura no celular" }]) }));
  await page.goto("/");
  const bell = page.getByRole("link", { name: "Notificações", exact: true });
  await expect(bell).toBeVisible();
  const bounds = await bell.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await bell.click();
  await expect(page.getByRole("heading", { name: "Notificações", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agendamento confirmado" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
