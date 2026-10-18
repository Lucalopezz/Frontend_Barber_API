# Ambiente e estado atual — 17/10/2026

> **Atualização — skills, autenticação e processo:** as skills de Playwright, React, Web Design
> Guidelines e Security Best Practices estão em `.agents/skills`, com origens,
> revisões e hashes registrados em `.agents/skills-lock.json`. Consulte
> `.agents/README.md` para uso e compatibilidade com Vite. O `AGENTS.md` passou
> a exigir TDD e regressão automatizada para bugs; telas podem ser feitas
> primeiro e testadas antes da conclusão. O diagnóstico inicial abaixo foi
> preservado como registro da retomada.

O login agora bloqueia reenvios enquanto a requisição está pendente e tem labels
associadas aos campos. O logout não dispara notificações durante o render, a
expiração da sessão mantém um aviso visível e um `401` atrasado da conta anterior
não encerra a sessão recém-aberta. Um `401` do próprio login também preserva a
sessão existente. Sete regressões permanentes em `tests/e2e/auth.spec.ts` passaram
com `pnpm test:e2e`; seis falhavam no código anterior e uma já passava.
O runner inicia e encerra o Vite em 5174 e intercepta a API com dados fictícios,
sem banco. Veja `tests/e2e/README.md`. Build e lint passaram após a integração.

Os defeitos foram reproduzidos no navegador antes da implementação. Parte do
código já estava iniciada quando foi solicitada a regra de TDD; a suíte
permanente foi acrescentada em seguida e validada contra o baseline e a
correção. O backend também passou a devolver `409` para indisponibilidade,
coberto por sete regressões com Fastify real, totalizando 329 testes de backend
aprovados nesta rodada.

O projeto de estudo incompleto passa a servir também como laboratório de IA,
skills, agentes e worktrees. O README original foi preservado com uma nota.
O backend continua no repositório independente `Projeto_Barber_API`, ao lado
deste diretório na máquina.

## Executar

Validado com Node `26.12.0` e pnpm `12.11.2`. O env local já está configurado
nesta máquina. Para uma cópia nova:

```bash
pnpm install --frozen-lockfile
cp -n .env.example .env.local
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

Abra `http://127.0.0.1:5173`. A API deve estar rodando em
`http://localhost:3001/api/v1`; essa é a variável `VITE_API_URL` do exemplo.
Variáveis `VITE_*` são públicas no bundle: não coloque chaves de IA nelas.
O backend permite CORS de `localhost:5173` e `127.0.0.1:5173`.

Crie sua conta em `/signup`: não há dados de demonstração pré-carregados.
Criar uma loja promove a conta de barbeiro para proprietário. Saia e entre
novamente após criar a loja para obter o token `owner` e gerir serviços.

## O que foi verificado

- Instalação com lock congelado, build e lint passaram.
- Chromium real validou cadastro cliente/barbeiro, login, restauração após
  reload, criação de loja, gestão/criação/listagem de serviço, troca de conta,
  listagem e cancelamento de reserva. Não houve exceção JavaScript não tratada.
- A reserva e o expediente usados nessa verificação foram criados pela API;
  as telas correspondentes ainda não existem. Dados temporários foram removidos.
- O backend aprovou 128 testes unitários, 185 de integração e 9 e2e.

Foram corrigidos rotas antigas, papel `owner`, atualização de perfil sem `role`,
filtro de serviços, PATCH de cancelamento, import do router, aplicação do token
e limpeza do cache na troca de conta. As versões antigas das dependências
foram preservadas ao importar o npm lock para pnpm.

## O que permanece incompleto

| Prioridade sugerida | Limitação                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0                  | Auditar/atualizar dependências antigas: `pnpm audit` retornou 101 registros (57 altos, 42 moderados, 2 baixos); `--prod`, 66 (32 altos, 33 moderados, 1 baixo). Não é comprovação de exploração. |
| P1                  | Botão Agendar sem ação; faltam seleção de serviço/horário, criação de reserva e configuração de expediente/folgas.                                                                               |
| P1                  | Novo login necessário após criar loja: token antigo continua `barber` e a gestão exige `owner`.                                                                                                  |
| P1                  | API retorna `500` para conflito de horário; o tratamento de erro de negócio precisa ser corrigido no backend.                                                                                    |
| P2                  | Editar reserva sem ação, alguns toasts antecipados e totais calculados sobre uma página.                                                                                                         |
| P2                  | Não há suite de frontend; build alerta para JS de 844,59 kB (gzip 246,90 kB).                                                                                                                    |
| P2                  | Tutorial `/services` menciona recursos ainda não implementados, como avaliações/favoritos/notificações.                                                                                          |

`--prod` segue as categorias atuais do package.json, que incluem ferramentas
de build em `dependencies`; não representa apenas código do navegador.
Alertas de versão de baseline e depreciação do Node também apareceram, sem
impedir o build.

## Próximos estudos

Comece por uma entrega pequena com critérios de aceite e verificação. Use um
agente para implementação e outro para revisão quando isso trouxer benefício.
Para front/back independentes, atribua uma branch/worktree e arquivos a cada
implementador; centralize a integração da jornada.

A worktree usada nesta sessão foi `../.worktrees/frontend-ai-lab`, branch
`chore/ai-lab-frontend`, commit `c3f0ce6`. Os diffs foram revisados e aplicados
ao original; documentação final e `.node-version` foram acrescentados nele.
Não foram instalados agentes permanentes. Confira `git worktree list` e
`git diff main...chore/ai-lab-frontend` para inspecionar a entrega do agente.

O relatório conjunto e o workflow completo estão em `docs/estado-atual.md` e
`docs/laboratorio-ia.md` **do repositório backend**, incluindo Docker, schemas,
prioridades e exemplos de prompts. Uma boa primeira feature de IA é consultar
catálogo e horários por ferramentas, com dados sintéticos e avaliação fixa,
mantendo autorização e disponibilidade sob responsabilidade da API.

## PS — entrega das partes 1 e 2 (18/10/2026)

A base foi atualizada com pnpm: React 19.3.1, Router 7.18.4, Axios 1.20.0 e Vite 7.3.7. A CLI antiga `shadcn-ui`, sem uso, foi removida. `pnpm audit` completo e `--prod` retornaram zero vulnerabilidades reportadas nesta data, sem ignorar avisos. O backend atualizado exige Node >=24.9; o ambiente integrado foi validado com Node 26.12.

A jornada implementada permite pesquisar lojas, selecionar serviço/data/horário, reservar, listar e cancelar. O dono configura expediente/folgas e remarca ou conclui atendimentos. A interface aguarda as mutações antes de indicar sucesso, atualiza horários após conflito 409, mantém o instante retornado pela API e interpreta folgas no fuso da loja. Catálogo, serviços e agendamentos respeitam paginação. A sessão continua válida após criar a loja, pois a API consulta a função atual no banco.

As regressões de autenticação, estado assíncrono, conflitos, permissões, paginação e fuso ficam versionadas em `tests/e2e`. A jornada com API/PostgreSQL reais está em `tests/integration`, executada por `pnpm test:integration`; consulte `tests/integration/README.md` para preparar ambiente e isolamento. Testes visuais usaram a exceção autorizada de implementar tela antes de testar; correções de bugs tiveram RED/GREEN observado.

Três agentes trabalharam em responsabilidades separadas: estabilização do backend, dependências de ambos e jornada frontend. Cada implementação usou branch/worktree própria; após revisão, os patches foram integrados nas cópias principais e verificados juntos. A revisão independente encontrou ajustes adicionais de edição de horário e acesso do profissional vinculado à própria agenda, incluídos nesta entrega.

A aplicação permanece um laboratório incompleto. As próximas entregas propostas são transformar o setup/verificação repetido em skill (parte 3) e implementar assistente com ferramentas de catálogo/horários e avaliações fixas (parte 4). Skills adicionais de documentação, investigação crítica de requisitos (grilling) e plano/spec serão avaliadas na próxima entrega, sem instalação nesta etapa.

Verificação final do frontend: lint e build aprovados; 21 cenários automatizados no Chromium aprovados em `pnpm test:e2e`.

As worktrees desta entrega ficam em `../.worktrees/frontend-booking-journey`, `frontend-dependencies`, `backend-stabilization` e `backend-dependencies`. Foram preservadas para comparação; a integração final e as correções da revisão estão nas cópias principais e devem ser versionadas nelas. Worktrees isolam arquivos e branches, mas o banco é compartilhado: as suítes que limpam o schema de teste foram executadas em sequência.

Resultado integrado final (18/10/2026): 351 testes do backend aprovados (130 unitários, 185 integração, 36 e2e), 21 cenários do frontend e uma jornada completa sem mocks HTTP aprovados. Lint/build aprovados nos dois repositórios. PostgreSQL Docker saudável; frontend em `http://localhost:5173`, API em `http://localhost:3001/api/v1` e Swagger em `http://localhost:3001/docs` durante a entrega. Os servidores são processos locais da sessão; após encerrá-los, use `pnpm start:dev` no backend e `pnpm dev` no frontend.

## PS — passo 3: skill de setup/verificação

A skill própria `barber-local-setup` foi criada em `.agents/skills` nos dois projetos. Ela concentra o procedimento para diagnosticar, preparar e verificar checkouts locais/worktrees com pnpm, env, PostgreSQL e as suites existentes. Foi validada por um agente independente em duas worktrees novas: 351 testes da API, 21 cenários do front e uma jornada com API/PostgreSQL reais passaram, com lint/build aprovados após corrigir dois espaços em classes vazias do backend. O modo diagnóstico preservou os env e não repetiu instalações ou migrações. Consulte [o relatório e os limites da avaliação](agents/setup-validation.md) e [o workflow de uso](agents/workflow.md). O assistente de consultas (passo 4), refresh token e cache não foram implementados nesta entrega.
