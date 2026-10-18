import { test, expect, type Page, type Route } from "@playwright/test";
const shop = {
  id: "shop-1",
  name: "Barbearia Escola",
  address: "Rua 1",
  ownerId: "owner",
  timezone: "America/Sao_Paulo",
};
const service = {
  id: "service-1",
  name: "Corte",
  duration: 30,
  price: 35,
  barberShopId: shop.id,
};
const slot = "2030-10-21T12:00:00.000Z";
async function setup(
  page: Page,
  role = "client",
  now = "2030-10-15T12:00:00.000Z",
) {
  await page.clock.setFixedTime(new Date(now));
  const requests: { method: string; path: string; body: unknown }[] = [];
  let status = "scheduled";
  await page.addInitScript(() => localStorage.setItem("token", "booking-test"));
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    requests.push({
      method: req.method(),
      path,
      body: req.postData() ? req.postDataJSON() : null,
    });
    let data: unknown = {};
    if (path.endsWith("/users/me"))
      data = {
        id: role === "client" ? "client" : "owner",
        role,
        name: "Estudante",
        barberShop:
          role === "client" ? null : { ...shop, relationship: "owner" },
      };
    else if (path.endsWith("/availability/me"))
      data = {
        timezone: shop.timezone,
        schedules: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1080 }],
        timeOffs: [],
      };
    else if (path.endsWith("/availability"))
      data = {
        timezone: shop.timezone,
        slots: [{ startsAt: slot, endsAt: "2030-10-21T12:30:00.000Z" }],
      };
    else if (path.endsWith("/appointments") && req.method() === "GET")
      return respond(route, {
        data: [
          {
            id: "appt-1",
            date: slot,
            status,
            clientId: "client",
            serviceId: service.id,
            barberShopId: shop.id,
          },
        ],
        meta: { lastPage: 1, total: 1 },
      });
    else if (path.endsWith("/appointments/appt-1") && req.method() === "PATCH")
      status = req.postDataJSON().newStatus;
    else if (path.endsWith("/services"))
      return respond(route, { data: [service] });
    else if (path.endsWith("/barber-shops"))
      return respond(route, { data: [shop], meta: { lastPage: 1, total: 1 } });
    else if (path.endsWith("/barber-shops/shop-1")) data = shop;
    return respond(route, { data });
  });
  return requests;
}
async function respond(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
async function selectSlot(page: Page) {
  await page.getByLabel("Serviço", { exact: true }).selectOption(service.id);
  await page.getByLabel("Data", { exact: true }).fill("2030-10-21");
  await page.getByRole("button", { name: "09:00", exact: true }).click();
}
test("cliente encontra loja, reserva horário UTC e acompanha/cancela sem editar", async ({
  page,
}) => {
  const requests = await setup(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await selectSlot(page);
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("status")).toContainText("Agendamento criado");
  expect(
    requests.find(
      (r) => r.method === "POST" && r.path.endsWith("/appointments"),
    )?.body,
  ).toEqual({ serviceId: service.id, date: slot });
  await page.goto("/appointments");
  await expect(
    page.getByRole("button", { name: "Editar", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
});
test("conflito 409 atualiza horários e não anuncia sucesso", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/v1/appointments", (route) =>
    route.request().method() === "POST"
      ? respond(route, { message: "Ocupado" }, 409)
      : route.fallback(),
  );
  await page.goto("/book/shop-1");
  await selectSlot(page);
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("alert")).toContainText("indisponível");
  await expect(
    page.getByRole("button", { name: "Confirmar agendamento" }),
  ).toBeDisabled();
});
test("dono usa contexto próprio e configura expediente e folga", async ({
  page,
}) => {
  const requests = await setup(page, "owner");
  await page.goto("/");
  await page.getByRole("link", { name: "Gerenciar Barbearia" }).click();
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByRole("status")).toContainText("Expediente salvo");
  await page.getByLabel("Início da folga").fill("2030-10-22T09:00");
  await page.getByLabel("Fim da folga").fill("2030-10-22T10:00");
  await page.getByRole("button", { name: "Adicionar folga" }).click();
  await expect(page.getByRole("status")).toContainText("Folga adicionada");
  expect(
    requests.some(
      (r) => r.path.endsWith("/barber-shops") && r.method === "GET",
    ),
  ).toBe(false);
  expect(requests.find((r) => r.path.endsWith("/time-offs"))?.body).toEqual({
    startsAt: "2030-10-22T12:00:00.000Z",
    endsAt: "2030-10-22T13:00:00.000Z",
    reason: "",
  });
});
test("falha ao concluir não anuncia sucesso nem permite envios duplicados", async ({
  page,
}) => {
  await setup(page, "owner");
  await page.route("**/appointments/appt-1", async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await respond(route, { message: "Falha" }, 500);
  });
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Concluir", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Erro ao alterar");
  await expect(
    page.getByText("Status do agendamento alterado com sucesso!"),
  ).toHaveCount(0);
});
test("reserva pendente bloqueia repetição e só anuncia sucesso após resposta", async ({
  page,
}) => {
  await setup(page);
  let release!: () => void;
  const held = new Promise<void>((done) => {
    release = done;
  });
  let count = 0;
  await page.route("**/api/v1/appointments", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    count++;
    await held;
    await respond(route, { data: {} }, 201);
  });
  await page.goto("/book/shop-1");
  await selectSlot(page);
  try {
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await expect(
      page.getByRole("button", { name: "Salvando…" }),
    ).toBeDisabled();
    await page.keyboard.press("Enter");
    expect(count).toBe(1);
    await expect(page.getByText("Agendamento criado.")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByRole("status")).toContainText("Agendamento criado.");
});
test("cliente não acessa gestão e cancelamento falho continua visível", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/barber-shop/shop-1");
  await expect(page.getByRole("alert")).toContainText("não pode gerenciar");
  await page.route("**/appointments/appt-1", (route) =>
    respond(route, { message: "Forbidden" }, 403),
  );
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.getByRole("alert")).toContainText("Erro ao cancelar");
  await expect(page.getByText("Agendado", { exact: true })).toBeVisible();
});
test("dono remarca com slot retornado pela API e conclui atendimento", async ({
  page,
}) => {
  const requests = await setup(page, "owner");
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Remarcar", exact: true }).click();
  await selectSlot(page);
  await page.getByRole("button", { name: "Confirmar remarcação" }).click();
  await expect(page.getByRole("status")).toContainText("Agendamento remarcado");
  expect(
    requests.find(
      (r) => r.method === "PUT" && r.path.endsWith("/appointments/appt-1"),
    )?.body,
  ).toEqual({ serviceId: service.id, date: slot });
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page.getByText("Concluído", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Concluir", exact: true }),
  ).toHaveCount(0);
});
test("folga existente pode ser removida e início posterior ao fim não envia pedido", async ({
  page,
}) => {
  const requests = await setup(page, "owner");
  await page.route("**/appointments/availability/me", (route) =>
    respond(route, {
      data: {
        timezone: shop.timezone,
        schedules: [],
        timeOffs: [
          {
            id: "off-1",
            startsAt: slot,
            endsAt: "2030-10-21T13:00:00Z",
            reason: "Folga de estudo",
          },
        ],
      },
    }),
  );
  await page.goto("/barber-shop/shop-1");
  await page
    .getByLabel("Início da folga", { exact: true })
    .fill("2030-10-22T10:00");
  await page
    .getByLabel("Fim da folga", { exact: true })
    .fill("2030-10-22T09:00");
  await page.getByRole("button", { name: "Adicionar folga" }).click();
  await expect(page.getByRole("alert")).toContainText("fim posterior");
  expect(
    requests.some((r) => r.method === "POST" && r.path.endsWith("/time-offs")),
  ).toBe(false);
  await page.getByRole("button", { name: "Remover folga off-1" }).click();
  await expect(page.getByRole("status")).toContainText("Folga removida");
});

test("listas paginadas permitem encontrar loja e agendamentos fora da primeira página", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/v1/barber-shops?*", (route) => {
    const pageNumber = new URL(route.request().url()).searchParams.get("page");
    return respond(route, {
      data: [
        {
          ...shop,
          name: pageNumber === "2" ? "Loja da segunda página" : shop.name,
        },
      ],
      meta: { currentPage: Number(pageNumber), lastPage: 2 },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(
    page.getByText("Loja da segunda página", { exact: true }),
  ).toBeVisible();
  await page.route("**/api/v1/appointments?*", (route) => {
    const pageNumber = new URL(route.request().url()).searchParams.get("page");
    return respond(route, {
      data:
        pageNumber === "2"
          ? [
              {
                id: "page-2",
                date: slot,
                status: "completed",
                barberShopId: shop.id,
                serviceId: service.id,
                clientId: "client",
              },
            ]
          : [],
      meta: { currentPage: Number(pageNumber), lastPage: 2 },
    });
  });
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(page.getByText("Concluído", { exact: true })).toBeVisible();
});

test("serviço da segunda página aparece na seleção sem depender da primeira página", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/v1/services?*", (route) => {
    const pageNumber = new URL(route.request().url()).searchParams.get("page");
    return respond(route, {
      data: [
        {
          ...service,
          id: pageNumber === "2" ? "service-2" : service.id,
          name: pageNumber === "2" ? "Serviço posterior" : service.name,
        },
      ],
      meta: { lastPage: 2 },
    });
  });
  await page.goto("/book/shop-1");
  await expect(
    page
      .getByLabel("Serviço", { exact: true })
      .locator('option[value="service-2"]'),
  ).toHaveText(/Serviço posterior/);
});

test("fim do expediente preserva digitação parcial e aceita 24:00, mas bloqueia 24:01", async ({
  page,
}) => {
  const requests = await setup(page, "owner");
  await page.goto("/barber-shop/shop-1");
  const end = page.getByLabel("Fim expediente 1", { exact: true });
  await end.fill("");
  await end.pressSequentially("18:30");
  await expect(end).toHaveValue("18:30");
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByRole("status")).toContainText("Expediente salvo");
  expect(
    requests
      .filter((r) => r.method === "PUT" && r.path.endsWith("/schedule"))
      .at(-1)?.body,
  ).toEqual({
    schedules: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1110 }],
  });
  await end.fill("");
  await end.pressSequentially("24:00");
  await expect(end).toHaveValue("24:00");
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect
    .poll(
      () =>
        requests.filter(
          (r) => r.method === "PUT" && r.path.endsWith("/schedule"),
        ).length,
    )
    .toBe(2);
  expect(
    requests
      .filter((r) => r.method === "PUT" && r.path.endsWith("/schedule"))
      .at(-1)?.body,
  ).toEqual({
    schedules: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1440 }],
  });
  await end.fill("");
  await end.pressSequentially("24:01");
  await expect(end).toHaveValue("24:01");
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  expect(
    await end.evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  expect(
    requests.filter((r) => r.method === "PUT" && r.path.endsWith("/schedule")),
  ).toHaveLength(2);
});

test("barbeiro vinculado configura disponibilidade própria sem acesso à gestão da loja", async ({
  page,
}) => {
  const requests = await setup(page, "barber");
  await page.route("**/api/v1/users/me", (route) =>
    respond(route, {
      data: {
        id: "barber",
        role: "barber",
        name: "Barbeiro vinculado",
        barberShop: { ...shop, relationship: "barber" },
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Gerenciar Barbearia" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Expediente e folgas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByRole("status")).toContainText("Expediente salvo");
  await page
    .getByLabel("Início da folga", { exact: true })
    .fill("2030-10-22T09:00");
  await page
    .getByLabel("Fim da folga", { exact: true })
    .fill("2030-10-22T10:00");
  await page.getByRole("button", { name: "Adicionar folga" }).click();
  await expect(page.getByRole("status")).toContainText("Folga adicionada");
  expect(
    requests.find((r) => r.method === "POST" && r.path.endsWith("/time-offs"))
      ?.body,
  ).toEqual({
    startsAt: "2030-10-22T12:00:00.000Z",
    endsAt: "2030-10-22T13:00:00.000Z",
    reason: "",
  });
  await page.goto("/barber-shop/shop-1");
  await expect(page.getByRole("alert")).toContainText("não pode gerenciar");
});

for (const scenario of [
  {
    name: "exatamente 24 horas",
    now: "2030-10-20T12:00:00.000Z",
    allowed: true,
  },
  {
    name: "menos de 24 horas",
    now: "2030-10-20T12:00:00.001Z",
    allowed: false,
  },
]) {
  test(`cancelamento pelo cliente: ${scenario.name}`, async ({ page }) => {
    const requests = await setup(page, "client", scenario.now);
    await page.goto("/appointments");
    const cancel = page.getByRole("button", { name: "Cancelar", exact: true });
    if (scenario.allowed) {
      await expect(cancel).toBeEnabled();
      await cancel.click();
      await page
        .getByRole("button", { name: "Confirmar cancelamento" })
        .click();
      await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
    } else {
      await expect(cancel).toBeDisabled();
      await expect(
        page.getByText(/O prazo para cancelamento pelo cliente terminou/),
      ).toBeVisible();
      expect(requests.some((request) => request.method === "PATCH")).toBe(
        false,
      );
    }
  });
}

test("cancelamento revalida o prazo quando a confirmação fica aberta", async ({
  page,
}) => {
  const requests = await setup(page, "client", "2030-10-20T11:59:59.000Z");
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.clock.setFixedTime(new Date("2030-10-20T12:00:00.001Z"));
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(
    page.getByText(/O prazo para cancelamento pelo cliente terminou/),
  ).toBeVisible();
  expect(requests.some((request) => request.method === "PATCH")).toBe(false);
});
