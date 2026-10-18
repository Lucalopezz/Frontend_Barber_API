# Frontend Barber — laboratório de estudo

- React 19 + TypeScript + Vite; use `pnpm` e mantenha `pnpm-lock.yaml`.
- Instalação: `pnpm install --frozen-lockfile`. Validação: `pnpm lint` e `pnpm build`.
- Copie `.env.example` para `.env.local`. A API local é `http://localhost:3001/api/v1`; confira o contrato no backend antes de alterar hooks.
- Variáveis `VITE_*` são públicas no bundle. Nunca registre tokens ou segredos.
- Rotas da interface podem usar `/barber-shop/:id`; endpoints HTTP usam `/barber-shops` e `/users/me`.
- A aplicação é incompleta. Não implemente features ou refactors fora da tarefa; descreva limitações e os testes realmente executados.
- Ao trabalhar em paralelo, use uma branch/worktree por tarefa. `node_modules`, `.env.local`, portas e processos devem ser configurados em cada worktree; não edite a worktree de outro agente.
