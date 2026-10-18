# Jornada completa com API real

`pnpm test:e2e` cobre a interface com respostas HTTP controladas. `pnpm test:integration` usa Chromium, a API compilada e PostgreSQL reais, sem mocks HTTP.

Pré-requisitos: Node >=24.9, pnpm, Docker e os dois repositórios lado a lado. Para outro caminho da API, defina `BARBER_API_DIR`.

No backend:

```bash
pnpm install --frozen-lockfile
pnpm db:up
pnpm prisma:generate
pnpm prisma:migrate:test
pnpm build
```

Configure `.env.test` conforme o exemplo, com `NODE_ENV=test` e `DATABASE_URL` apontando exclusivamente para `schema=barber_api_test`.

No frontend:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:integration
```

Se Chromium já estiver instalado, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:integration`.

O runner inicia e encerra seus servidores nas portas 3002 e 5175, que precisam estar livres. Não execute junto com as suítes de banco do backend: elas limpam o mesmo schema. O teste cria usuários únicos e remove apenas seus próprios registros, respeitando as relações; recusa configuração de outro schema.

Cenários: dono cria loja/serviço sem refazer login, configura expediente e folga; cliente pesquisa catálogo e agenda; conflito concorrente devolve 409 e atualiza horários; isolamento entre clientes; cancelamento; dono remarca e conclui. Navegador em UTC e loja em São Paulo verificam a conversão do horário. Traces de falhas ficam ignorados pelo Git e podem conter dados de sessão.

## PS — assistente simulado

`assistant.real.spec.ts` cobre a tela autenticada com catálogo, serviços e disponibilidade reais, incluindo slot ocupado, navegador em UTC/loja em São Paulo e recusa de escrita sem alterar reservas. O teste cria fixtures únicas e remove somente seus registros no schema isolado. O simulador não chama provedor externo. Execute junto da jornada de agendamento pelo mesmo `pnpm test:integration`, sequencialmente e sem suítes da API concorrendo pelo schema.
