import { mockSession } from "./session-fixture";
import { expect, test } from "@playwright/test";

test("cria barbearia montando endereço a partir dos campos separados", async ({
  page,
}) => {
  let submittedAddress: string | undefined;
  await mockSession(page, "shop-address-test");
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
    if (path.endsWith("/users/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: "owner-1", name: "Dono", role: "owner", barberShop: null },
        }),
      });
    }
    if (path.endsWith("/appointments")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], meta: { lastPage: 1, total: 0 } }),
      });
    }
    if (path.endsWith("/barber-shops") && request.method() === "POST") {
      submittedAddress = request.postDataJSON().address;
    }
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Criar Loja" }).click();
  await page.getByLabel("Nome").fill("Barbearia Teste");
  await page.getByLabel("Logradouro").fill("Rua das Flores");
  await page.getByLabel("Número").fill("12a");
  await page.getByLabel("Cidade").fill("São Paulo");
  await page.getByLabel("Estado").fill("sp");
  await expect(page.getByLabel("Número")).toHaveValue("12");
  await expect(page.getByLabel("Estado")).toHaveValue("SP");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect.poll(() => submittedAddress).toBe("Rua das Flores, 12, São Paulo – SP");
});
