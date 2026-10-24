import { mockSession } from "./session-fixture";
import { test, expect, type Page } from "@playwright/test";

async function openManagement(page: Page) {
  const writes: { method: string; data: Record<string, unknown> }[] = [];
  await mockSession(page, "price-test");
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    const shop = {
      id: "shop-1",
      name: "Navalha Clube",
      address: "Rua Um, 12, São Paulo – SP",
      timezone: "America/Sao_Paulo",
      createdAt: "2026-01-01",
    };
    let data: unknown = {};
    if (path.endsWith("/users/me"))
      data = {
        id: "owner",
        name: "João",
        role: "owner",
        barberShop: { ...shop, relationship: "owner" },
      };
    else if (path.endsWith("/barber-shops/shop-1")) data = shop;
    else if (path.endsWith("/services") && request.method() === "GET")
      data = [
        {
          id: "service-1",
          name: "Corte clássico",
          description: "Tesoura e acabamento",
          price: 35.5,
          duration: 30,
          barberShopId: shop.id,
        },
      ];
    else if (path.endsWith("/availability/me"))
      data = { timezone: shop.timezone, schedules: [], timeOffs: [] };
    if (
      /\/services(?:\/service-1)?$/.test(path) &&
      ["POST", "PATCH"].includes(request.method())
    ) {
      writes.push({ method: request.method(), data: request.postDataJSON() });
    }
    await route.fulfill({ json: { data, meta: { lastPage: 1, total: 1 } } });
  });
  await page.goto("/barber-shop/shop-1/services");
  await expect(
    page.getByRole("heading", { name: "Sua barbearia" }),
  ).toBeVisible();
  return writes;
}

test("novo preço começa vazio, aceita vírgula e envia número sem zero forçado", async ({
  page,
}) => {
  const writes = await openManagement(page);
  const price = page.getByLabel("Preço (R$)", { exact: true });
  await expect(price).toHaveValue("");
  await page.getByPlaceholder("Corte masculino").fill("Barba completa");
  await page.getByPlaceholder("Descreva o serviço").fill("Navalha e toalha");
  await price.fill("47,90");
  await page
    .getByRole("button", { name: "Criar Serviço", exact: true })
    .click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].data.price).toBe(47.9);
  await expect(price).toHaveValue("");
});

test("apagar preço não vira serviço grátis; zero explícito e decimal com ponto são aceitos", async ({
  page,
}) => {
  const writes = await openManagement(page);
  const price = page.getByLabel("Preço (R$)", { exact: true });
  await page.getByPlaceholder("Corte masculino").fill("Barba completa");
  await page.getByPlaceholder("Descreva o serviço").fill("Navalha e toalha");
  await price.fill("50");
  await price.fill("");
  await expect(price).toHaveValue("");
  await page
    .getByRole("button", { name: "Criar Serviço", exact: true })
    .click();
  await expect(
    page.getByText("Informe o preço", { exact: true }),
  ).toBeVisible();
  expect(writes).toHaveLength(0);
  for (const [input, output] of [
    ["0", 0],
    ["35.50", 35.5],
  ] as const) {
    await page.getByPlaceholder("Corte masculino").fill("Barba completa");
    await page.getByPlaceholder("Descreva o serviço").fill("Navalha e toalha");
    await price.fill(input);
    await page
      .getByRole("button", { name: "Criar Serviço", exact: true })
      .click();
    await expect.poll(() => writes.length).toBe(output === 0 ? 1 : 2);
    expect(writes.at(-1)?.data.price).toBe(output);
    await expect(price).toHaveValue("");
  }
});

test("edição permite limpar preço e redigitar centavos sem gravar valor vazio", async ({
  page,
}) => {
  const writes = await openManagement(page);
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Corte clássico" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const price = dialog.getByLabel("Preço (R$)", { exact: true });
  await price.fill("");
  await expect(price).toHaveValue("");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    dialog.getByText("Informe o preço", { exact: true }),
  ).toBeVisible();
  expect(writes).toHaveLength(0);
  await price.fill("42,75");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ method: "PATCH", data: { price: 42.75 } });
});

test("aviso de exclusão descreve o efeito real sem dizer que apaga o perfil do dono", async ({
  page,
}) => {
  await openManagement(page);
  await page.getByRole("navigation", { name: "Gestão da barbearia" }).getByRole("link", { name: "Dados" }).click();
  await page.getByText("Excluir barbearia", { exact: true }).first().click();
  await expect(
    page.getByText(
      "Seu perfil permanece. Barbearias com agendamentos não podem ser excluídas.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("O PERFIL DO DONO", { exact: true })).toHaveCount(
    0,
  );
});

test("criação mostra falha sem perder dados e confirma a tentativa seguinte", async ({
  page,
}) => {
  await openManagement(page);
  let shouldFail = true;
  await page.route("**/api/v1/services", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: shouldFail ? 400 : 201,
          json: shouldFail ? { message: "Falha" } : { data: { id: "new" } },
        })
      : route.fallback(),
  );
  await page.getByPlaceholder("Corte masculino").fill("Barba completa");
  await page.getByPlaceholder("Descreva o serviço").fill("Navalha e toalha");
  await page.getByLabel("Preço (R$)", { exact: true }).fill("25,90");
  await page
    .getByRole("button", { name: "Criar Serviço", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível criar o serviço",
  );
  await expect(page.getByLabel("Preço (R$)", { exact: true })).toHaveValue(
    "25,90",
  );
  shouldFail = false;
  await page
    .getByRole("button", { name: "Criar Serviço", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Serviço criado.");
});
