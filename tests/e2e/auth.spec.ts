import { expect, test, type Page, type Route } from "@playwright/test";

// Deliberately fake tokens. All API calls are intercepted; no database is used.
const accounts = {
  a: {
    id: "test-user-a",
    name: "Auth Study A",
    email: "auth-a@example.test",
    token: "fake-session-a",
  },
  b: {
    id: "test-user-b",
    name: "Auth Study B",
    email: "auth-b@example.test",
    token: "fake-session-b",
  },
};
const password = "TestPassword2026!";
const apiPattern = "**/api/v1/**";
const loginPattern = "**/api/v1/users/login";
const userPattern = "**/api/v1/users/me";

async function respond(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });
}

async function login(page: Page, account: keyof typeof accounts) {
  // Placeholders also allow running regression tests against the old UI.
  await page.getByPlaceholder("seu@exemplo.com").fill(accounts[account].email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Encontre uma Barbearia" }),
  ).toBeVisible();
}

async function openProfile(page: Page) {
  await page
    .getByRole("button", { name: "Abrir menu da conta", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Meu Perfil", exact: true }).click();
}

async function logout(page: Page) {
  await page
    .getByRole("button", { name: "Abrir menu da conta", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test.beforeEach(async ({ page }) => {
  await page.route(apiPattern, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") return respond(route, 200, {});
    if (path.endsWith("/users/login")) {
      const input = request.postDataJSON();
      const account = Object.values(accounts).find(
        (value) => value.email === input.email,
      );
      return account && input.password === password
        ? respond(route, 201, { accessToken: account.token })
        : respond(route, 400, { message: "Credenciais inválidas" });
    }
    if (path.endsWith("/users/me")) {
      const account = Object.values(accounts).find(
        (value) => request.headers().authorization === `Bearer ${value.token}`,
      );
      return account
        ? respond(route, 200, {
            data: {
              ...account,
              role: "client",
              createdAt: "2026-01-01T12:00:00Z",
              ownedBarberShops: [],
            },
          })
        : respond(route, 401, { message: "Unauthorized" });
    }
    return respond(route, 200, {
      data: [],
      meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 15 },
    });
  });
  await page.goto("/login");
});

test("login fields have accessible labels and autofill metadata", async ({
  page,
}) => {
  const email = page.getByRole("textbox", { name: "E‑mail", exact: true });
  await expect(email).toBeVisible();
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("autocomplete", "email");
  await page.getByText("E‑mail", { exact: true }).click();
  await expect(email).toBeFocused();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
});

test("pending login disables resubmission and recovers after a rejected request", async ({
  page,
}) => {
  const held = deferred();
  let requests = 0;
  await page.route(loginPattern, async (route) => {
    requests += 1;
    await held.promise;
    await respond(route, 400, { message: "Credenciais inválidas" });
  });
  await page.getByPlaceholder("seu@exemplo.com").fill(accounts.a.email);
  await page.getByPlaceholder("••••••••").fill("WrongPassword2026!");
  const button = page.getByRole("button", { name: /^Entr/ });
  try {
    await button.click();
    await expect.poll(() => requests).toBe(1);
    await expect(button).toBeDisabled();
    await expect(button).toHaveText("Entrando…");
    await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    expect(requests).toBe(1);
  } finally {
    held.resolve();
  }
  await expect(page.getByRole("alert")).toHaveText("Credenciais inválidas");
  await expect(button).toBeEnabled();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "false");
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await page.unroute(loginPattern);
  await login(page, "a");
});

test("logout clears the session without duplicate authentication alerts or render warnings", async ({
  page,
}) => {
  const renderErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Cannot update|while rendering/.test(message.text())
    )
      renderErrors.push(message.text());
  });
  await login(page, "a");
  await logout(page);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Logout realizado com sucesso!" }),
  ).toBeVisible();
  await expect(
    page.getByText("Você não está autenticado! Por favor, faça login."),
  ).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  expect(renderErrors).toEqual([]);
});

test("reload restores the session and account switching clears the old profile cache", async ({
  page,
}) => {
  await login(page, "a");
  await openProfile(page);
  await expect(page.getByText(accounts.a.name, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(accounts.a.name, { exact: true })).toBeVisible();
  await logout(page);
  await login(page, "b");
  await openProfile(page);
  await expect(page.getByText(accounts.b.name, { exact: true })).toBeVisible();
  await expect(page.getByText(accounts.a.name, { exact: true })).toHaveCount(0);
});

test("a 401 for the current session redirects once and keeps the expiration message after reload", async ({
  page,
}) => {
  await login(page, "a");
  await page.route(userPattern, (route) =>
    respond(route, 401, { message: "Expired" }),
  );
  await openProfile(page);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toHaveText(
    "Sessão expirada. Faça login novamente.",
  );
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("sessionExpired")),
  ).toBeNull();
});

test("an old account's delayed 401 cannot expire the new account session", async ({
  page,
}) => {
  await login(page, "a");
  const held = deferred();
  const started = deferred();
  await page.route(userPattern, async (route) => {
    if (
      route.request().headers().authorization !== `Bearer ${accounts.a.token}`
    )
      return route.fallback();
    started.resolve();
    await held.promise;
    await respond(route, 401, { message: "Expired old session" });
  });
  await openProfile(page);
  await started.promise;
  try {
    await logout(page);
    await login(page, "b");
  } finally {
    held.resolve();
  }
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBe(
    accounts.b.token,
  );
  await openProfile(page);
  await expect(page.getByText(accounts.b.name, { exact: true })).toBeVisible();
});

test("a login endpoint 401 preserves an existing authenticated session", async ({
  page,
}) => {
  await login(page, "a");
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await page.route(loginPattern, (route) =>
    respond(route, 401, { message: "Credenciais inválidas" }),
  );
  await page.getByPlaceholder("seu@exemplo.com").fill(accounts.b.email);
  await page.getByPlaceholder("••••••••").fill("WrongPassword2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBe(
    accounts.a.token,
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "Credenciais inválidas" }),
  ).toBeVisible();
});
