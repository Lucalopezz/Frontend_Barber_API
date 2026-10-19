import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const api = "http://127.0.0.1:3002/api/v1";
const origin = "http://127.0.0.1:5175";
const apiDirectory = resolve(
  process.env.BARBER_API_DIR ?? "../Projeto_Barber_API",
);
const sessionHeaders = {
  Origin: origin,
  "X-Barber-Session": "1",
};
type Session = {
  accessToken: string;
  sessionId: string;
  accessTokenExpiresAt: string;
  sessionExpiresAt: string;
};
type Account = { id: string; email: string; password: string };
const accounts: Account[] = [];

async function account(request: APIRequestContext): Promise<Account> {
  const input = {
    name: "Cliente sessões reais",
    email: `sessions-${randomUUID()}@example.test`,
    password: randomUUID(),
    role: "client",
  };
  const response = await request.post(`${api}/users`, { data: input });
  expect(response.status()).toBe(201);
  const created = { ...input, id: (await response.json()).data.id as string };
  accounts.push(created);
  return created;
}

async function login(page: Page, user: Account): Promise<Session> {
  await page.goto("/login");
  await page.getByPlaceholder("seu@exemplo.com").fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  const response = page.waitForResponse(
    (result) =>
      result.request().method() === "POST" &&
      result.url() === `${api}/users/login`,
  );
  await page
    .locator("form")
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  const result = await response;
  expect(result.status()).toBe(201);
  const session = (await result.json()) as Session;
  // Check booleans so a failed assertion cannot print a usable token.
  expect(typeof session.accessToken === "string").toBe(true);
  expect(typeof session.sessionId === "string").toBe(true);
  expect(Number.isFinite(Date.parse(session.accessTokenExpiresAt))).toBe(true);
  expect(Number.isFinite(Date.parse(session.sessionExpiresAt))).toBe(true);
  await expect(page).toHaveURL(`${origin}/`);
  await expect(page.getByRole("button", { name: "Abrir menu da conta" }))
    .toBeVisible();
  return session;
}

async function logout(page: Page, waitForServer = true) {
  const response = waitForServer ? page.waitForResponse((result) =>
    result.request().method() === "POST" && result.url() === `${api}/auth/logout`,
  ) : undefined;
  await page.getByRole("button", { name: "Abrir menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("button", { name: "Abrir menu da conta" }))
    .toHaveCount(0);
  if (response) expect((await response).status()).toBe(204);
}

async function persistentCredentialsAbsent(page: Page, session: Session) {
  const clean = await page.evaluate(({ accessToken }) => {
    const entries = [localStorage, sessionStorage].flatMap((store) =>
      Object.keys(store).map((key) => [key, store.getItem(key) ?? ""]),
    );
    return entries.every(([key, value]) =>
      key !== "token" &&
      !value.includes(accessToken) &&
      !/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value),
    );
  }, { accessToken: session.accessToken });
  expect(clean).toBe(true);
  const hidden = await page.evaluate(() =>
    !document.cookie.includes("barber_refresh_"),
  );
  expect(hidden).toBe(true);
}

async function cookieFor(context: BrowserContext, sid: string) {
  const cookies = await context.cookies(`${api}/auth/refresh`);
  const cookie = cookies.find((item) => item.name === `barber_refresh_${sid}`);
  expect(Boolean(cookie)).toBe(true);
  return cookie!;
}

async function assertAuthorized(request: APIRequestContext, token: string) {
  const response = await request.get(`${api}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
}

test.afterAll(async () => {
  if (!accounts.length) return;
  const environment = parseEnv(
    readFileSync(resolve(apiDirectory, ".env.test"), "utf8"),
  );
  if (
    environment.NODE_ENV !== "test" ||
    !environment.DATABASE_URL ||
    new URL(environment.DATABASE_URL).searchParams.get("schema") !==
      "barber_api_test"
  ) {
    throw new Error("Cleanup de sessões recusado fora de barber_api_test.");
  }
  const require = createRequire(resolve(apiDirectory, "package.json"));
  type Database = {
    user: { deleteMany(input: { where: { id: { in: string[] } } }): Promise<unknown> };
    $disconnect(): Promise<void>;
  };
  const { PrismaClient } = require("@prisma/client") as {
    PrismaClient: new (options: { datasourceUrl: string }) => Database;
  };
  const database = new PrismaClient({ datasourceUrl: environment.DATABASE_URL });
  try {
    // These users have no bookings. Session/token relations must cascade so the
    // previous main's booking fixture cleanup remains compatible too.
    await database.user.deleteMany({
      where: { id: { in: accounts.map((item) => item.id) } },
    });
  } finally {
    await database.$disconnect();
  }
});

test("real login restores after reload and browser reopening without persistent tokens", async ({
  browser, request,
}) => {
  const user = await account(request);
  const context = await browser.newContext({ baseURL: origin });
  let reopened: BrowserContext | undefined;
  try {
    const page = await context.newPage();
    const session = await login(page, user);
    const cookie = await cookieFor(context, session.sessionId);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(false); // This suite intentionally uses HTTP local.
    expect(cookie.sameSite).toBe("Lax");
    expect(cookie.path).toBe("/api/v1/auth");
    await persistentCredentialsAbsent(page, session);
    await page.reload();
    await expect(page.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    await persistentCredentialsAbsent(page, session);
    const persistedCookies = await context.cookies();
    await context.close();
    // A new context has no JS storage; copy only browser-persisted cookies.
    reopened = await browser.newContext({ baseURL: origin });
    await reopened.addCookies(persistedCookies);
    const restored = await reopened.newPage();
    await restored.goto("/appointments");
    await expect(restored).toHaveURL(`${origin}/appointments`);
    await expect(restored.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    await persistentCredentialsAbsent(restored, session);
    await logout(restored);
  } finally {
    await reopened?.close();
    await context.close();
  }
});

test("two real tabs coalesce rejected-token refresh and synchronize logout", async ({
  browser, request,
}) => {
  const user = await account(request);
  const context = await browser.newContext({ baseURL: origin });
  try {
    const first = await context.newPage();
    const session = await login(first, user);
    const second = await context.newPage();
    await second.goto("/");
    await expect(second.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    let refreshes = 0;
    context.on("request", (sent) => {
      if (sent.method() === "POST" && sent.url() === `${api}/auth/refresh`)
        refreshes++;
    });
    let readyCount = 0;
    let releaseBarrier!: () => void;
    const bothReady = new Promise<void>((resolve) => { releaseBarrier = resolve; });
    await context.exposeBinding("__waitForRefreshBarrier", async () => {
      readyCount++;
      if (readyCount === 2) releaseBarrier();
      await bothReady;
    });
    const refreshesStarted = [first, second].map((page) => page.evaluate(async (rejectedToken) => {
      await (window as unknown as { __waitForRefreshBarrier: () => Promise<void> }).__waitForRefreshBarrier();
      await (await import("/src/auth/session.ts")).refreshSession(rejectedToken);
    }, session.accessToken));
    await Promise.all(refreshesStarted);
    const sessionIds = await Promise.all([first, second].map((page) => page.evaluate(async () =>
      (await import("/src/auth/session.ts")).getSessionSnapshot()?.sessionId,
    )));
    expect(sessionIds).toEqual([session.sessionId, session.sessionId]);
    const appointmentsLoaded = [first, second].map((page) =>
      page.waitForResponse((response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname === "/api/v1/appointments" &&
        response.status() === 200,
      ),
    );
    await Promise.all([first, second].map((page) =>
      page.getByRole("navigation", { name: "Navegação principal" })
        .getByRole("link", { name: "Agendamentos", exact: true }).click(),
    ));
    await Promise.all(appointmentsLoaded);
    await expect(first).toHaveURL(`${origin}/appointments`);
    await expect(second).toHaveURL(`${origin}/appointments`);
    expect(refreshes).toBe(1);
    await logout(first);
    await expect(second.getByRole("button", { name: "Abrir menu da conta" }))
      .toHaveCount(0);
    expect(refreshes).toBe(1);
    const oldAccess = await request.get(`${api}/users/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(oldAccess.status()).toBe(401);
  } finally {
    await context.close();
  }
});

test("API outage during logout survives reload and revokes before a different account login", async ({
  browser, request,
}) => {
  const oldUser = await account(request);
  const newUser = await account(request);
  const context = await browser.newContext({ baseURL: origin });
  try {
    const page = await context.newPage();
    const oldSession = await login(page, oldUser);
    // Fault injection cuts only API transport; Vite remains reachable for reload.
    await context.route(`${api}/**`, (route) => route.abort("internetdisconnected"));
    await logout(page, false);
    await page.reload();
    await expect(page.getByRole("button", { name: "Abrir menu da conta" }))
      .toHaveCount(0);
    // Server has not received revocation: local output must not claim otherwise.
    await assertAuthorized(request, oldSession.accessToken);
    expect((await context.cookies()).some((cookie) =>
      cookie.name === `barber_refresh_${oldSession.sessionId}`,
    )).toBe(true);
    await context.unroute(`${api}/**`);
    const newSession = await login(page, newUser);
    const oldAccess = await request.get(`${api}/users/me`, {
      headers: { Authorization: `Bearer ${oldSession.accessToken}` },
    });
    expect(oldAccess.status()).toBe(401);
    await assertAuthorized(request, newSession.accessToken);
    expect((await context.cookies()).some((cookie) =>
      cookie.name === `barber_refresh_${oldSession.sessionId}`,
    )).toBe(false);
    await cookieFor(context, newSession.sessionId);
    await persistentCredentialsAbsent(page, newSession);
    await logout(page);
  } finally {
    await context.close();
  }
});

test("refresh replay revokes one real device while the other stays connected", async ({
  browser, request,
}) => {
  const user = await account(request);
  const first = await browser.newContext({ baseURL: origin });
  const second = await browser.newContext({ baseURL: origin });
  try {
    const firstPage = await first.newPage();
    const firstSession = await login(firstPage, user);
    const secondPage = await second.newPage();
    const secondSession = await login(secondPage, user);
    const oldCookie = await cookieFor(first, firstSession.sessionId);
    const headers = {
      ...sessionHeaders,
      Cookie: `${oldCookie.name}=${oldCookie.value}`,
    };
    const rotated = await request.post(`${api}/auth/refresh`, {
      headers, data: { sessionId: firstSession.sessionId },
    });
    expect(rotated.status()).toBe(200);
    const rotatedSession = (await rotated.json()) as Session;
    const replay = await request.post(`${api}/auth/refresh`, {
      headers, data: { sessionId: firstSession.sessionId },
    });
    expect(replay.status()).toBe(401);
    const revoked = await request.get(`${api}/users/me`, {
      headers: { Authorization: `Bearer ${rotatedSession.accessToken}` },
    });
    expect(revoked.status()).toBe(401);
    await assertAuthorized(request, secondSession.accessToken);
    await secondPage.reload();
    await expect(secondPage.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    await logout(secondPage);
  } finally {
    await Promise.all([first.close(), second.close()]);
  }
});

test("real browser cookie endpoints require the CSRF header without consuming the session", async ({
  browser, request,
}) => {
  const user = await account(request);
  const context = await browser.newContext({ baseURL: origin });
  try {
    const page = await context.newPage();
    const session = await login(page, user);
    const rejected = await page.evaluate(async ({ api, sid }) => {
      const statuses = [];
      for (const action of ["refresh", "logout"]) {
        const response = await fetch(`${api}/auth/${action}`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
        statuses.push(response.status);
      }
      return statuses;
    }, { api, sid: session.sessionId });
    expect(rejected).toEqual([403, 403]);
    await assertAuthorized(request, session.accessToken);
    await page.reload();
    await expect(page.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    await logout(page);
  } finally {
    await context.close();
  }
});

test("cookie protocol isolates an old direct-HTTP logout response from a later UI login", async ({
  browser, request,
}) => {
  const oldUser = await account(request);
  const newUser = await account(request);
  const context = await browser.newContext({ baseURL: origin });
  let releaseResponse: (() => void) | undefined;
  try {
    const oldPage = await context.newPage();
    const oldSession = await login(oldPage, oldUser);
    let notifyRevoked!: () => void;
    const serverRevoked = new Promise<void>((resolve) => { notifyRevoked = resolve; });
    const release = new Promise<void>((resolve) => { releaseResponse = resolve; });
    let delayed = false;
    await context.route(`${api}/auth/logout`, async (route) => {
      if (delayed) return route.continue();
      delayed = true;
      // The actual backend revokes A now; only its response delivery is delayed.
      const response = await route.fetch();
      notifyRevoked();
      await release;
      await route.fulfill({ response });
    });
    // Exercise cookie isolation with a direct HTTP call, outside the frontend
    // coordinator. This does not create a local pending marker or hold its lock.
    // UI login must still complete its own normal/idempotent logout if needed.
    const oldLogout = oldPage.evaluate(async ({ api, sid }) => {
      const result = await fetch(`${api}/auth/logout`, {
        method: "POST", credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Barber-Session": "1",
        },
        body: JSON.stringify({ sessionId: sid }),
      });
      return result.status;
    }, { api, sid: oldSession.sessionId }).catch(() => 0);
    await serverRevoked;
    const newPage = await context.newPage();
    const newSession = await login(newPage, newUser);
    releaseResponse!();
    expect(await oldLogout).toBe(204);
    await cookieFor(context, newSession.sessionId);
    await newPage.reload();
    await expect(newPage.getByRole("button", { name: "Abrir menu da conta" }))
      .toBeVisible();
    await assertAuthorized(request, newSession.accessToken);
    await logout(newPage);
  } finally {
    releaseResponse?.();
    await context.close();
  }
});
