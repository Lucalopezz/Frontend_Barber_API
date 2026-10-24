import { mockSession, sessionTokens } from "./session-fixture";
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
  await mockSession(page, "booking-test");
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    if (path.includes("/auth/")) return route.fallback();
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
    else if (path.endsWith("/barber-shops/shop-1/barbers"))
      data = [{ id: "owner", name: "Estudante", role: "owner" }];
    else if (path.endsWith("/appointments") && req.method() === "GET")
      return respond(route, {
        data: [
          {
            id: "appt-1",
            date: slot,
            status,
            clientId: "client",
            barberId: "owner",
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
  ).toEqual({ serviceId: service.id, date: slot, barberId: "owner" });
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
  await page.getByRole("link", { name: "Gerenciar expediente" }).click();
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByRole("status")).toContainText("Expediente salvo");
  await page.getByRole("tab", { name: "Folgas" }).click();
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
test("dono vê reserva da equipe sem ações reservadas ao profissional atribuído", async ({ page }) => {
  await setup(page, "owner");
  await page.route(/\/api\/v1\/appointments(?:\?.*)?$/, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return respond(route, { data: [{ id: "staff-appt", date: slot, status: "scheduled", clientId: "client", barberId: "staff", serviceId: service.id, barberShopId: shop.id }], meta: { lastPage: 1, total: 1 } });
  });
  await page.goto("/appointments");
  await expect(page.getByText("Atendimento de outro profissional da equipe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Concluir" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remarcar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancelar" })).toHaveCount(0);
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
  await page.goto("/availability");
  await page.getByRole("tab", { name: "Folgas" }).click();
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
  await page.goto("/availability");
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
  await page.getByRole("link", { name: "Gerenciar expediente" }).click();
  await expect(page.getByRole("heading", { name: "Meu expediente" })).toBeVisible();
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByRole("status")).toContainText("Expediente salvo");
  await page.getByRole("tab", { name: "Folgas" }).click();
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

test('rascunho permanece no reload e revalida usuário e disponibilidade',async({page})=>{
 const requests=await setup(page);await page.goto('/book/shop-1');await selectSlot(page);
 await page.reload();
 await expect(page.getByLabel('Serviço',{exact:true})).toHaveValue(service.id);
 await expect(page.getByLabel('Data',{exact:true})).toHaveValue('2030-10-21');
 await expect(page.getByRole('button',{name:'09:00',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(requests.filter(r=>r.path.endsWith('/users/me')).length).toBeGreaterThanOrEqual(2);
 expect(requests.filter(r=>r.path.endsWith('/availability')).length).toBeGreaterThanOrEqual(2);
});
test('resposta perdida reconcilia reserva e não repete a mutação',async({page})=>{
 await setup(page);let posts=0;
 await page.route(/\/api\/v1\/appointments(?:\?.*)?$/,route=>{
  if(route.request().method()==='POST'){posts++;return route.abort('failed');}
  return respond(route,{data:[{id:'committed',date:slot,clientId:'client',barberId:'owner',serviceId:service.id,barberShopId:shop.id,status:'scheduled'}],meta:{lastPage:1,total:1}});
 });
 await page.goto('/book/shop-1');await selectSlot(page);
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();
 await expect(page.getByRole('status')).toContainText('Agendamento confirmado após consultar suas reservas');expect(posts).toBe(1);
});
test('resultado incerto bloqueia reenvio inclusive após reload e preserva campos',async({page})=>{
 await setup(page);let posts=0;
 await page.route(/\/api\/v1\/appointments(?:\?.*)?$/,route=>{
  if(route.request().method()==='POST'){posts++;return route.abort('failed');}
  return respond(route,{data:[],meta:{lastPage:1,total:0}});
 });
 await page.goto('/book/shop-1');await selectSlot(page);
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar');
 await page.reload();await expect(page.getByLabel('Serviço',{exact:true})).toHaveValue(service.id);
 await expect(page.getByRole('button',{name:'Confirmar agendamento'})).toBeDisabled();
 await expect(page.getByRole('link',{name:'Revisar meus agendamentos'})).toBeVisible();expect(posts).toBe(1);
});
test('remarcação do profissional com resposta perdida reconcilia pelo ID autorizado',async({page})=>{
 await setup(page,'owner');let puts=0;
 await page.route(/\/api\/v1\/appointments(?:\?.*)?$/,route=>respond(route,{data:[{id:'appt-1',date:slot,clientId:'client',barberId:'owner',serviceId:service.id,barberShopId:shop.id,status:'scheduled'}],meta:{lastPage:1,total:1}}));
 await page.route('**/api/v1/appointments/appt-1',route=>{if(route.request().method()==='PUT'){puts++;return route.abort('failed');}return route.fallback();});
 await page.goto('/appointments');await page.getByRole('button',{name:'Remarcar',exact:true}).click();
 await page.getByLabel('Data',{exact:true}).fill('2030-10-21');await page.getByRole('button',{name:'09:00',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar remarcação'}).click();
 await expect(page.getByRole('status')).toContainText('Agendamento confirmado após consultar suas reservas');expect(puts).toBe(1);
});
test('falha de renovação anterior ao envio preserva formulário e permite retomar sem falsa incerteza',async({page})=>{
 await setup(page);let posts=0,offline=true;
 await page.route('**/api/v1/appointments',route=>{posts++;return respond(route,{data:{id:'new'}});});
 await page.goto('/book/shop-1');await selectSlot(page);
 await page.clock.setFixedTime(new Date('2100-01-01T00:00:00Z'));
 await page.route('**/api/v1/auth/refresh',route=>offline?route.abort('failed'):route.fulfill({json:{accessToken:'recovered',sessionId:'11111111-1111-4111-8111-111111111111',accessTokenExpiresAt:'2101-01-01T00:00:00Z',sessionExpiresAt:'2101-01-02T00:00:00Z'}}));
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();
 await expect(page.getByRole('button',{name:'Tentar recuperar sessão'})).toBeVisible();expect(posts).toBe(0);
 offline=false;await page.getByRole('button',{name:'Tentar recuperar sessão'}).click();
 await expect(page.getByLabel('Serviço',{exact:true})).toHaveValue(service.id);
 await expect(page.getByRole('button',{name:'Confirmar agendamento'})).toBeEnabled();
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();await expect(page.getByRole('status')).toContainText('Agendamento criado');expect(posts).toBe(1);
});
test('expiração preserva rascunho até novo login da mesma pessoa e revalida horários',async({page})=>{
 const requests=await setup(page);await page.goto('/book/shop-1');await selectSlot(page);
 await page.route('**/api/v1/auth/refresh',route=>route.fulfill({status:401,json:{code:'AUTH_SESSION_INVALID'}}));
 await page.evaluate(async()=>{const module=await import('/src/auth/session.ts');try{await module.refreshSession('booking-test');}catch{ /* Expiration is observed in the UI. */ }});
 await expect(page).toHaveURL(/\/login$/);
 await page.route('**/api/v1/users/login',route=>route.fulfill({status:201,json:sessionTokens('new-login-same-user','22222222-2222-4222-8222-222222222222')}));
 await page.getByPlaceholder('seu@exemplo.com').fill('same@example.test');await page.getByPlaceholder('••••••••').fill('Password2026!');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page).toHaveURL(/\/book\/shop-1$/);await expect(page.getByLabel('Serviço',{exact:true})).toHaveValue(service.id);
 await expect(page.getByRole('button',{name:'Confirmar agendamento'})).toBeEnabled();
 expect(requests.filter(r=>r.path.endsWith('/availability')).length).toBeGreaterThanOrEqual(2);
});
test('troca de conta descarta dados do rascunho anterior',async({page})=>{
 await setup(page);await page.goto('/book/shop-1');await selectSlot(page);
 await page.route('**/api/v1/users/login',route=>route.fulfill({status:201,json:sessionTokens('new-user')}));
 await page.route('**/api/v1/users/me',route=>respond(route,{data:{id:'client-b',role:'client',name:'Outra pessoa'}}));
 await page.goto('/login');await page.getByPlaceholder('seu@exemplo.com').fill('other@example.test');await page.getByPlaceholder('••••••••').fill('Password2026!');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/\/$/);
 await page.goto('/book/shop-1');await expect(page.getByLabel('Serviço',{exact:true})).toHaveValue('');
 expect(await page.evaluate(()=>sessionStorage.getItem('barber.booking.draft.v1'))).toBeNull();
});
test('reconciliação indisponível não libera reenvio nem declara ausência de reserva',async({page})=>{
 await setup(page);let posts=0;
 await page.route(/\/api\/v1\/appointments(?:\?.*)?$/,route=>{if(route.request().method()==='POST')posts++;return route.abort('failed');});
 await page.goto('/book/shop-1');await selectSlot(page);await page.getByRole('button',{name:'Confirmar agendamento'}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar');await expect(page.getByRole('button',{name:'Confirmar agendamento'})).toBeDisabled();
 await page.getByRole('button',{name:'Consultar resultado novamente'}).click();
 await expect(page.getByRole('alert')).toContainText('Revise seus agendamentos');expect(posts).toBe(1);
});
test('401 definitivo antes do POST não deixa falsa incerteza após novo login',async({page})=>{
 await setup(page);let posts=0;await page.route('**/api/v1/appointments',route=>{posts++;return respond(route,{data:{id:'new'}});});
 await page.goto('/book/shop-1');await selectSlot(page);await page.clock.setFixedTime(new Date('2100-01-01T00:00:00Z'));
 await page.route('**/api/v1/auth/refresh',route=>route.fulfill({status:401,json:{code:'AUTH_SESSION_INVALID'}}));
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();await expect(page).toHaveURL(/\/login$/);expect(posts).toBe(0);
 await page.route('**/api/v1/users/login',route=>route.fulfill({status:201,json:{...sessionTokens('after-definitive-expiry'),accessTokenExpiresAt:'2101-01-01T00:00:00Z',sessionExpiresAt:'2101-01-02T00:00:00Z'}}));
 await page.getByPlaceholder('seu@exemplo.com').fill('same@example.test');await page.getByPlaceholder('••••••••').fill('Password2026!');await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Confirmar agendamento'})).toBeEnabled();
});
test('callback de tentativa não enviada da conta anterior não regrava rascunho da conta nova indisponível',async({page})=>{
 await setup(page);await page.goto('/book/shop-1');await selectSlot(page);await page.clock.setFixedTime(new Date('2100-01-01T00:00:00Z'));
 await page.route('**/api/v1/auth/refresh',route=>route.abort('failed'));
 await page.evaluate(async()=>{
  const {default:api}=await import('/src/utils/api.ts');
  const hold=window as unknown as {oldRequestWaiting?:boolean;releaseOldRequest?:()=>void};
  let once=true;
  api.interceptors.response.use(undefined,async error=>{
   if(once && error?.requestNotSent){once=false;hold.oldRequestWaiting=true;await new Promise<void>(resolve=>{hold.releaseOldRequest=resolve;});}
   throw error;
  });
 });
 await page.getByRole('button',{name:'Confirmar agendamento'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {oldRequestWaiting?:boolean}).oldRequestWaiting)).toBe(true);
 await page.evaluate(async()=>{await(await import('/src/auth/session.ts')).logoutSession();});
 await page.route('**/api/v1/users/login',route=>route.fulfill({status:201,json:{...sessionTokens('account-b'),accessTokenExpiresAt:'2101-01-01T00:00:00Z',sessionExpiresAt:'2101-01-02T00:00:00Z'}}));
 await page.route('**/api/v1/users/me',route=>respond(route,{data:{id:'client-b',role:'client',name:'Conta B'}}));
 await page.evaluate(async()=>{await(await import('/src/auth/session.ts')).loginSession({email:'b@example.test',password:'Password2026!'});});
 await page.evaluate(async()=>{try{await(await import('/src/auth/session.ts')).refreshSession('account-b');}catch{ /* B is unavailable. */ }});
 await page.evaluate(async()=>{
  sessionStorage.setItem('barber.booking.draft.v1',JSON.stringify({version:1,userId:'client-b',shopId:'shop-1',serviceId:'private-b',date:'2100-01-10',slot:'2100-01-10T12:00:00Z'}));
  (window as unknown as {releaseOldRequest:()=>void}).releaseOldRequest();
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 });
 await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('barber.booking.draft.v1')!).userId)).toBe('client-b');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('barber.booking.draft.v1')!).serviceId)).toBe('private-b');
});

test('agendamentos e disponibilidade revalidam a cada 30 segundos enquanto a consulta está ativa', async ({ page }) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  const requests = await setup(page);
  await page.goto("/appointments");
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/appointments").length).toBe(1);
  await page.clock.fastForward(30_000);
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/appointments").length).toBe(2);

  await page.goto("/book/shop-1");
  await page.getByLabel("Serviço", { exact: true }).selectOption(service.id);
  await page.getByLabel("Data", { exact: true }).fill("2030-10-21");
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/barber-shops/shop-1/availability").length).toBe(1);
  await page.clock.fastForward(30_000);
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/barber-shops/shop-1/availability").length).toBe(2);

  await page.goto("/appointments");
  const availabilityRequests = requests.filter((r) => r.path === "/api/v1/barber-shops/shop-1/availability").length;
  await page.clock.fastForward(60_000);
  expect(requests.filter((r) => r.path === "/api/v1/barber-shops/shop-1/availability").length).toBe(availabilityRequests);
});

test('chaves de agendamentos e disponibilidade isolam identidade e todos os parâmetros', async ({ page }) => {
  await page.goto("/login");
  const keys = await page.evaluate(async () => {
    const { appointmentKeys, availabilityKeys } = await import("/src/hooks/queries/appointments/queryKeys.ts");
    return {
      appointmentsA: appointmentKeys.list("sid-a", { page: 1, perPage: 20, date: "2030-10-21", serviceId: "service-a" }),
      appointmentsOtherPage: appointmentKeys.list("sid-a", { page: 2, perPage: 20, date: "2030-10-21", serviceId: "service-a" }),
      appointmentsOtherFilter: appointmentKeys.list("sid-a", { page: 1, perPage: 20, date: "2030-10-22", serviceId: "service-a" }),
      appointmentsOtherIdentity: appointmentKeys.list("sid-b", { page: 1, perPage: 20, date: "2030-10-21", serviceId: "service-a" }),
      slotsA: availabilityKeys.shop("sid-a", "shop-a", "service-a", "2030-10-21"),
      slotsOtherService: availabilityKeys.shop("sid-a", "shop-a", "service-b", "2030-10-21"),
      slotsOtherDate: availabilityKeys.shop("sid-a", "shop-a", "service-a", "2030-10-22"),
      slotsOtherIdentity: availabilityKeys.shop("sid-b", "shop-a", "service-a", "2030-10-21"),
      ownOtherIdentity: availabilityKeys.own("sid-b"),
    };
  });
  expect(keys.appointmentsA).not.toEqual(keys.appointmentsOtherPage);
  expect(keys.appointmentsA).not.toEqual(keys.appointmentsOtherFilter);
  expect(keys.appointmentsA).not.toEqual(keys.appointmentsOtherIdentity);
  expect(keys.slotsA).not.toEqual(keys.slotsOtherService);
  expect(keys.slotsA).not.toEqual(keys.slotsOtherDate);
  expect(keys.slotsA).not.toEqual(keys.slotsOtherIdentity);
  expect(keys.ownOtherIdentity[1]).toBe("sid-b");
});

test('disponibilidade do profissional atualiza a cada 30 segundos enquanto a gestão está aberta', async ({ page }) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  const requests = await setup(page, "owner");
  await page.goto("/availability");
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/appointments/availability/me").length).toBe(1);
  await page.clock.fastForward(30_000);
  await expect.poll(() => requests.filter((r) => r.path === "/api/v1/appointments/availability/me").length).toBe(2);
});

test('falha ao atualizar agendamentos informa dados desatualizados e preserva a lista', async ({ page }) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  const requests = await setup(page);
  let failRefresh = false;
  let refreshRequests = 0;
  await page.route(/\/api\/v1\/appointments(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    refreshRequests++;
    return failRefresh ? respond(route, { message: "offline" }, 503) : route.fallback();
  });
  await page.goto("/appointments");
  await expect.poll(() => refreshRequests).toBe(1);
  await expect(page.getByText("Agendado", { exact: true })).toBeVisible();
  failRefresh = true;
  await page.clock.fastForward(30_000);
  await expect.poll(() => refreshRequests).toBeGreaterThan(1);
  await expect(page.getByRole("alert")).toContainText("Não foi possível atualizar os agendamentos", { timeout: 15_000 });
  await expect(page.getByText("Agendado", { exact: true })).toBeVisible();
  failRefresh = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(requests.filter((r) => r.path === "/api/v1/appointments").length).toBeGreaterThan(1);
});

test('falha ao atualizar expediente informa dados antigos e preserva a edição em andamento', async ({ page }) => {
  await page.clock.install({ time: new Date("2030-10-15T12:00:00.000Z") });
  await setup(page, "owner");
  let failRefresh = false;
  let refreshRequests = 0;
  await page.route("**/api/v1/appointments/availability/me", async (route) => {
    refreshRequests++;
    return failRefresh ? respond(route, { message: "offline" }, 503) : route.fallback();
  });
  await page.goto("/availability");
  await expect.poll(() => refreshRequests).toBe(1);
  await page.getByLabel("Início expediente 1", { exact: true }).fill("10:00");
  failRefresh = true;
  await page.clock.fastForward(30_000);
  await expect.poll(() => refreshRequests).toBeGreaterThan(1);
  await expect(page.getByRole("alert")).toContainText("Não foi possível atualizar o expediente", { timeout: 15_000 });
  await expect(page.getByLabel("Início expediente 1", { exact: true })).toHaveValue("10:00");
  failRefresh = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Início expediente 1", { exact: true })).toHaveValue("10:00");
});

test('falha ao atualizar disponibilidade preserva o formulário e bloqueia a reserva até nova resposta válida', async ({ page }) => {
  let failSecondDate = false;
  let posts = 0;
  const availabilityDates: string[] = [];
  await setup(page);
  await page.route("**/api/v1/appointments", async (route) => {
    if (route.request().method() === "POST") {
      posts++;
      return respond(route, { data: { id: "created" } }, 201);
    }
    return route.fallback();
  });
  await page.route(/\/api\/v1\/barber-shops\/shop-1\/availability(?:\?.*)?$/, async (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    availabilityDates.push(String(date));
    if (date === "2030-10-22" && failSecondDate) return respond(route, { message: "offline" }, 503);
    return respond(route, {
      data: {
        timezone: shop.timezone,
        slots: [{ startsAt: slot, endsAt: "2030-10-21T12:30:00.000Z" }],
      },
    });
  });
  await page.goto("/book/shop-1");
  await page.getByLabel("Serviço", { exact: true }).selectOption(service.id);
  await page.getByLabel("Data", { exact: true }).fill("2030-10-21");
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  failSecondDate = true;
  await page.getByLabel("Data", { exact: true }).fill("2030-10-22");
  await expect.poll(() => availabilityDates.length).toBe(2);
  await expect(page.getByRole("alert")).toContainText("Erro ao consultar horários", { timeout: 15_000 });
  await expect(page.getByLabel("Serviço", { exact: true })).toHaveValue(service.id);
  await expect(page.getByLabel("Data", { exact: true })).toHaveValue("2030-10-22");
  await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toBeDisabled();
  failSecondDate = false;
  await page.getByRole("button", { name: "Tentar novamente" }).last().click();
  await expect(page.getByRole("button", { name: "09:00", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("status")).toContainText("Agendamento criado");
  expect(posts).toBe(1);
});
