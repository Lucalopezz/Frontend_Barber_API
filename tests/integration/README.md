# Jornada completa com API real

`pnpm test:e2e` cobre a interface com respostas HTTP controladas. `pnpm test:integration` usa Chromium, a API compilada e PostgreSQL reais, sem mocks HTTP.

O [CI integrado](../../docs/ci-integracao.md) automatiza as jornadas em PRs e pushes na `main` dos dois projetos, registra os dois SHAs e permite escolher um commit do outro repositório na execução manual. Executa primeiro a jornada de agendamento e depois a de notificações, quando o checkout frontend contém seu runner. O procedimento abaixo prepara a execução local; no GitHub, cada job recebe PostgreSQL e Redis próprios e env exclusivos de teste.

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

## Notificações com worker real

`pnpm test:notifications` executa jornadas dedicadas com API, PostgreSQL, Redis e o worker compilado. Exige as partes 1 a 4 do backend, suas dependências instaladas, migrations de teste aplicadas e `pnpm build` concluído, além do Redis local saudável na porta configurada no `.env.test` da API. O Compose do backend inclui esse serviço.

```bash
BARBER_API_DIR=/caminho/absoluto/Projeto_Barber_API pnpm test:notifications
```

A configuração inicia e encerra API (3002), Vite (5175) e worker separados. O worker usa Redis DB 1 e prefixo exclusivo por execução, sem alterar as filas de desenvolvimento. O primeiro cenário cria a reserva pela interface e confere as confirmações nas telas do cliente e profissional; altera horário/serviço e confere o histórico anterior e novo; marca uma notificação como lida e verifica contagem, repetição idempotente e rejeição de outro destinatário; cancela pelo profissional e verifica que somente o cliente recebe o cancelamento. Outro cliente continua com a caixa vazia. O navegador usa UTC e a interface mostra 09:00/10:00 no fuso de São Paulo.

Essa jornada fica fora de `pnpm test:integration`, que continua sem exigir Redis. Execute as jornadas e suítes de banco sequencialmente; a limpeza remove somente as fixtures dessa execução no schema `barber_api_test`.

O segundo cenário possui contas e reserva próprias, criadas pela API, e ajusta somente essa fixture com Prisma no schema `barber_api_test`: início duas horas no futuro e criação há dois dias. Não insere evento de lembrete nem enfileira um job manual. Aguarda até 75 segundos para o cron UTC real de um minuto criar a outbox, o publicador enfileirar e o worker entregar; confirma um único evento processado e destinatário cliente, ausência de lembrete para o profissional e exibição no fuso da loja quando o cliente abre o navegador depois da entrega. O timeout do cenário é de 180 segundos para incluir preparação e login. Datas de produção e relógio do worker não são modificados. Os testes backend com relógio controlado continuam cobrindo limites exatos de 24 horas, recuperação após atraso e descarte após remarcação/cancelamento.

## Histórico — assistente simulado removido

O antigo `assistant.real.spec.ts` cobria consultas de catálogo, serviços e disponibilidade sem escrita. Foi removido junto da funcionalidade. A jornada real de agendamento em `booking.real.spec.ts` permanece ativa, com os mesmos requisitos de banco e execução sequencial descritos acima.
