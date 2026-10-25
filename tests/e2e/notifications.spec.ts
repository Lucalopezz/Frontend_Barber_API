import { expect, test, type Page, type Route } from "@playwright/test";
import { mockSession, sessionTokens } from "./session-fixture";
import type { Notification } from "../../src/types/notification.type";

test.use({ timezoneId: "UTC" });

const notice: Notification = {
  id: "notice-1",
  appointmentId: "appointment-1",
  type: "appointment_created",
  serviceName: "Corte",
  barberShopName: "Barbearia Escola",
  startsAt: "2030-01-07T12:00:00.000Z",
  previousStartsAt: null,
  previousServiceName: null,
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

async function mockNotifications(page: Page, respond: (route: Route) => Promise<unknown>, extra: { unread?: (route: Route) => Promise<unknown>; read?: (route: Route) => Promise<unknown> } = {}) {
  await mockSession(page, "notification-session");
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (path.endsWith("/users/me")) return route.fulfill({ json: { data: { id: "client-1", name: "Cliente", role: "client" } } });
    if (path.endsWith("/notifications/unread-count")) return extra.unread ? extra.unread(route) : route.fulfill({ json: { data: { count: 1 } } });
    if (path.endsWith("/read")) return extra.read ? extra.read(route) : route.fulfill({ json: { data: { ...notice, readAt: "2030-01-02T12:00:00.000Z" } } });
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
    if (path.includes("/notifications")) requests++;
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
    if (path.endsWith("/notifications/unread-count")) return route.fulfill({ json: { data: { count: 1 } } });
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

test("mostra alterações com dados anteriores e novos e mantém confirmações e cancelamentos no histórico", async ({ page }) => {
  await mockNotifications(page, (route) => route.fulfill({ json: collection([
    { ...notice, id: "changed", type: "appointment_updated", serviceName: "Barba", previousServiceName: "Corte", previousStartsAt: "2030-01-07T12:00:00.000Z", startsAt: "2030-01-08T15:00:00.000Z" },
    { ...notice, id: "cancelled", type: "appointment_cancelled" },
    notice,
  ]) }));
  await page.goto("/notifications");
  const changed = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Agendamento alterado" }) });
  await expect(changed.getByText("Serviço anterior", { exact: true })).toBeVisible();
  await expect(changed.getByText("Corte", { exact: true })).toBeVisible();
  await expect(changed.getByText("Novo serviço", { exact: true })).toBeVisible();
  await expect(changed.getByText("Barba", { exact: true })).toBeVisible();
  await expect(changed.locator("time")).toHaveText(["07/01/2030, 09:00", "08/01/2030, 12:00"]);
  await expect(page.getByRole("heading", { name: "Agendamento cancelado", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agendamento confirmado", exact: true })).toBeVisible();
});

test("confirma leitura no servidor antes de alterar a lista e a contagem do sino", async ({ page }) => {
  const pending = barrier();
  const reached = barrier();
  let readAt: string | null = null;
  await mockNotifications(page, (route) => route.fulfill({ json: collection([{ ...notice, readAt }]) }), {
    unread: (route) => route.fulfill({ json: { data: { count: readAt ? 0 : 1 } } }),
    read: async (route) => {
      expect(route.request().method()).toBe("PATCH");
      reached.release();
      await pending.promise;
      readAt = "2030-01-02T12:00:00.000Z";
      return route.fulfill({ json: { data: { ...notice, readAt } } });
    },
  });
  await page.goto("/notifications");
  const bell = page.getByRole("link", { name: "Notificações", exact: true });
  await expect(bell).toHaveAccessibleDescription("1 notificação não lida.");
  await page.getByRole("button", { name: "Marcar como lida", exact: true }).click();
  await reached.promise;
  await expect(page.getByRole("button", { name: "Salvando…", exact: true })).toBeDisabled();
  await expect(page.getByText("Não lida", { exact: true })).toBeVisible();
  await expect(bell).toHaveAccessibleDescription("1 notificação não lida.");
  pending.release();
  await expect(page.getByText("Lida", { exact: true })).toBeVisible();
  await expect(bell).toHaveAccessibleDescription("0 notificações não lidas.");
  await expect(page.getByRole("button", { name: "Marcar como lida", exact: true })).toHaveCount(0);
});

test("falha de leitura preserva o aviso não lido e permite tentar novamente sem falso sucesso", async ({ page }) => {
  let succeed = false;
  let readAt: string | null = null;
  let attempts = 0;
  await mockNotifications(page, (route) => route.fulfill({ json: collection([{ ...notice, readAt }]) }), {
    unread: (route) => route.fulfill({ json: { data: { count: readAt ? 0 : 1 } } }),
    read: (route) => {
      attempts++;
      if (!succeed) return route.fulfill({ status: 500, json: { message: "Falha temporária" } });
      readAt = "2030-01-02T12:00:00.000Z";
      return route.fulfill({ json: { data: { ...notice, readAt } } });
    },
  });
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Marcar como lida", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível marcar a notificação como lida.");
  await expect(page.getByText("Não lida", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("1 notificação não lida.");
  expect(attempts).toBe(1);
  succeed = true;
  await page.getByRole("button", { name: "Marcar como lida", exact: true }).click();
  await expect(page.getByText("Lida", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("atualiza lista e contagem a cada trinta segundos somente em primeiro plano", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
  let lists = 0;
  let counts = 0;
  await mockNotifications(page, (route) => route.fulfill({ json: collection([{ ...notice, serviceName: `Corte ${++lists}` }]) }), {
    unread: (route) => route.fulfill({ json: { data: { count: ++counts } } }),
  });
  await page.goto("/notifications");
  await expect(page.getByText("Corte 1 em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("1 notificação não lida.");
  await page.clock.fastForward(20_000);
  expect(lists).toBe(1);
  expect(counts).toBe(1);
  await page.clock.fastForward(10_000);
  await expect(page.getByText("Corte 2 em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("2 notificações não lidas.");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(60_000);
  expect(lists).toBe(2);
  expect(counts).toBe(2);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    window.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByText("Corte 3 em Barbearia Escola", { exact: true })).toBeVisible();
});

test("sino continua acessível quando a contagem falha e não inventa zero", async ({ page }) => {
  await mockNotifications(page, (route) => route.fulfill({ json: collection() }), {
    unread: (route) => route.fulfill({ status: 503, json: { message: "Indisponível" } }),
  });
  await page.goto("/notifications");
  const bell = page.getByRole("link", { name: "Notificações", exact: true });
  await expect(bell).toHaveAccessibleDescription("Contagem de notificações indisponível.");
  await expect(bell).not.toContainText("0");
  await expect(page.getByRole("heading", { name: "Agendamento confirmado", exact: true })).toBeVisible();
});

test("contagem grande limita o selo visual e mantém o total para leitor de tela", async ({ page }) => {
  await mockNotifications(page, (route) => route.fulfill({ json: collection() }), {
    unread: (route) => route.fulfill({ json: { data: { count: 204 } } }),
  });
  await page.goto("/notifications");
  const bell = page.getByRole("link", { name: "Notificações", exact: true });
  await expect(bell).toContainText("99+");
  await expect(bell).toHaveAccessibleDescription("204 notificações não lidas.");
});

test("leitura atrasada da conta anterior não altera a lista nem a contagem da próxima conta", async ({ page }) => {
  const reached = barrier();
  const resume = barrier();
  const settled = barrier();
  let current: "a" | "b" = "a";
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/logout")) return route.fulfill({ status: 204 });
    if (path.endsWith("/users/login")) current = "b";
    if (path.endsWith("/auth/refresh") || path.endsWith("/users/login")) return route.fulfill({ json: sessionTokens(`account-${current}`, current === "a" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222") });
    if (path.endsWith("/users/me")) return route.fulfill({ json: { data: { id: current, name: current, role: "client" } } });
    if (path.endsWith("/notifications/unread-count")) return route.fulfill({ json: { data: { count: current === "a" ? 1 : 7 } } });
    if (path.endsWith("/read")) {
      reached.release(); await resume.promise;
      await route.fulfill({ json: { data: { ...notice, serviceName: "Corte conta A", readAt: "2030-01-02T12:00:00.000Z" } } }).catch(() => { /* Identity change aborts this request. */ });
      settled.release(); return;
    }
    if (path.endsWith("/notifications")) return route.fulfill({ json: collection([{ ...notice, serviceName: current === "a" ? "Corte conta A" : "Barba conta B" }]) });
    return route.fulfill({ json: collection([]) });
  });
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Marcar como lida", exact: true }).click();
  await reached.promise;
  await page.evaluate(async () => { await (await import("/src/auth/session.ts")).loginSession({ email: "b@example.test", password: "Password2026!" }); });
  await page.getByRole("link", { name: "Notificações", exact: true }).click();
  await expect(page.getByText("Barba conta B em Barbearia Escola", { exact: true })).toBeVisible();
  resume.release(); await settled.promise;
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("7 notificações não lidas.");
  await expect(page.getByText("Não lida", { exact: true })).toBeVisible();
  await expect(page.getByText("Lida", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Corte conta A em Barbearia Escola", { exact: true })).toHaveCount(0);
});

test("mostra lembrete recuperado no fuso da loja e permite leitura sem apagar a confirmação", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-01-07T10:00:00.000Z") });
  let readAt: string | null = null;
  const reminder: Notification = {
    ...notice, id: "reminder-1", type: "appointment_reminder", createdAt: "2030-01-07T09:59:00.000Z",
  };
  await mockNotifications(page, (route) => route.fulfill({ json: collection([{ ...reminder, readAt }, notice]) }), {
    unread: (route) => route.fulfill({ json: { data: { count: readAt ? 1 : 2 } } }),
    read: (route) => {
      expect(new URL(route.request().url()).pathname).toBe("/api/v1/notifications/reminder-1/read");
      expect(route.request().method()).toBe("PATCH");
      readAt = "2030-01-07T10:00:00.000Z";
      return route.fulfill({ json: { data: { ...reminder, readAt } } });
    },
  });
  await page.goto("/notifications");
  const item = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Lembrete de agendamento", exact: true }) });
  await expect(item.getByText("Corte em Barbearia Escola", { exact: true })).toBeVisible();
  await expect(item.locator("time")).toHaveText("07/01/2030, 09:00");
  await expect(item.getByText("Horário da barbearia", { exact: true })).toBeVisible();
  await expect(item).not.toContainText("24 horas");
  await expect(item.getByRole("link", { name: "Ver na agenda", exact: true })).toHaveAttribute("href", "/appointments");
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("2 notificações não lidas.");
  await item.getByRole("button", { name: "Marcar como lida", exact: true }).click();
  await expect(item.getByText("Lida", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notificações", exact: true })).toHaveAccessibleDescription("1 notificação não lida.");
  const confirmation = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Agendamento confirmado", exact: true }) });
  await expect(confirmation.getByText("Não lida", { exact: true })).toBeVisible();
});
