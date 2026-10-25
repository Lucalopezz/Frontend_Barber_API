# Frontend Barber — laboratório de estudo

- React 19 + TypeScript + Vite; use `pnpm` e mantenha `pnpm-lock.yaml`.
- Instalação: `pnpm install --frozen-lockfile`. Validação: `pnpm lint`, `pnpm build` e `pnpm test:e2e`; preparação e cenários de regressão estão em `tests/e2e/README.md`.
- Copie `.env.example` para `.env.local`. A API local é `http://localhost:3001/api/v1`; confira o contrato no backend antes de alterar hooks.
- Variáveis `VITE_*` são públicas no bundle. Nunca registre tokens ou segredos.
- Rotas da interface podem usar `/barber-shop/:id`; endpoints HTTP usam `/barber-shops` e `/users/me`.
- A aplicação é incompleta. Não implemente features ou refactors fora da tarefa; descreva limitações e os testes realmente executados.
- Ao trabalhar em paralelo, use uma branch/worktree por tarefa. `node_modules`, `.env.local`, portas e processos devem ser configurados em cada worktree; não edite a worktree de outro agente.
- Escreva comentários para explicar decisões, regras, invariantes e limites que não sejam óbvios pela leitura do código, sobretudo o motivo de uma proteção contra corrida ou isolamento. Evite comentários que apenas narram a linha seguinte; mantenha cada comentário junto à lógica que explica e atualize-o quando a regra mudar.

## Skills locais

- As skills externas estão em `.agents/skills`; origens e revisões estão em `.agents/skills-lock.json` e o escopo em `.agents/README.md`.
- Use `playwright` para investigar fluxos no navegador, `vercel-react-best-practices` para componentes/dados/performance e `web-design-guidelines` para revisão de interface. A skill React fica no diretório `react-best-practices`.
- Este front usa React/Vite. Orientações específicas de Next.js, RSC, Server Actions ou deploy Vercel não se aplicam automaticamente.
- Use `security-best-practices` quando a tarefa pedir revisão ou implementação de segurança; não trate a instalação como autorização para ampliar o escopo.
- Traces, screenshots e arquivos de sessão gerados na investigação devem ficar fora do Git, especialmente quando contiverem tokens.

## TDD e regressões obrigatórios

- Todo bug corrigido deve incluir um teste automatizado de regressão versionado que reproduza o defeito, falhe com o comportamento anterior e passe com a correção. Uma verificação manual ou um script temporário fora do repositório não substitui esse teste.
- A regra geral para implementar ou alterar comportamento é TDD: escrever o teste, executá-lo e confirmar a falha esperada (RED), implementar a menor correção que o faça passar (GREEN) e então refatorar mantendo os testes aprovados (REFACTOR). A falha deve demonstrar o requisito, não um erro de configuração.
- Exceção autorizada: em trabalho visual de telas do frontend, a tela pode ser implementada primeiro e os testes escritos depois, antes de considerar a entrega concluída. Essa exceção não dispensa testes nem a regressão automatizada de bugs.
- Cubra o comportamento observável, inclusive falhas e estado assíncrono quando relevantes. Evite testes que apenas repetem a implementação. Execute a regressão e as verificações relacionadas após a mudança.
- Na entrega, informe quais cenários foram cobertos e o resultado das execuções. Só afirme que seguiu TDD se o ciclo RED/GREEN foi realmente observado; registre quando usou a exceção visual.

- A jornada integrada com API e PostgreSQL reais usa `pnpm test:integration`; pré-requisitos e isolamento em `tests/integration/README.md`. Não a execute em paralelo com testes do backend que limpem `barber_api_test`.

## Agent skills

- Workflow de docs, grilling, spec e tarefas: consulte `docs/agents/workflow.md`. Instruções do projeto e do usuário prevalecem sobre exemplos genéricos das skills; preserve português, pnpm, TDD e docs históricas.
- Issue tracker: Markdown local em `.scratch/<feature-slug>/`; detalhes em `docs/agents/issue-tracker.md`. “Publicar” uma spec/tarefa significa escrever arquivo local, sem criar issues ou labels remotos. O setup já está concluído.
- Fontes de domínio e convenção de contexto único: `docs/agents/domain.md`; glossários/ADRs ausentes não bloqueiam o trabalho.
- Use `grill-me`/`grilling`, `to-spec` e `to-tickets` quando solicitados; não transforme ajustes pequenos em entrevistas. Quando a interface não tiver ferramenta `Skill`, carregue o `SKILL.md` local diretamente; `grill-me` carrega `grilling`.

- Use a skill própria `barber-local-setup` em `.agents/skills/barber-local-setup/SKILL.md` para preparar/verificar o ambiente Barber, inclusive worktrees. Ela distingue diagnóstico sem mutações de preparação e verificação, preserva env existentes e coordena o schema compartilhado de testes.

- Para criação/repaginação de telas, use também `.agents/skills/frontend-design/SKILL.md`. A identidade e os princípios de interface estão em `docs/interface.md`; textos da aplicação devem orientar tarefas de clientes/profissionais, deixando detalhes técnicos do laboratório em áreas explicitamente opcionais.
