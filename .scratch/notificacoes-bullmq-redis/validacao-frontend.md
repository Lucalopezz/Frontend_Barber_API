# Validação frontend — notificações, parte 1

Implementação revisada em `.worktrees/notifications-part1-front`, com dependências próprias instaladas offline a partir do store local. Nenhum commit foi criado.

## Comportamento

- Rota privada `/notifications`, acessível pelo sino no cabeçalho em desktop/celular.
- Consulta paginada por sessão, atualização manual, carregamento, caixa vazia e recuperação de erro.
- Confirmação com serviço, barbearia, horário no fuso da loja e link para a agenda.
- Sem leitura, contador ou atualização periódica, reservados às próximas partes.

## Verificações executadas

- `pnpm lint`: aprovado.
- `pnpm build`: aprovado. Permanecem os avisos de comentários do Zod/Rollup e bundle maior que 500 kB.
- Descoberta dos oito testes em `tests/e2e/notifications.spec.ts`: aprovada.
- `BARBER_API_DIR` apontando ao backend principal, `pnpm exec playwright test --config playwright.notifications.config.ts --list`: aprovado, uma jornada real descoberta.
- Execução Playwright bloqueada antes dos testes porque o sandbox não permite abrir `127.0.0.1:5174`. Uma tentativa direta de `pnpm dev --host 127.0.0.1 --port 5174 --strictPort` confirmou `listen EPERM`.
- Captura/revisão visual em navegador e jornada com API/PostgreSQL/Redis reais pendentes pelo ambiente. Nenhum resultado de execução desses cenários foi presumido.

A tela inicial foi criada antes dos testes, usando a exceção visual prevista no `AGENTS.md`. Não se afirma RED/GREEN para os novos cenários de interface enquanto a execução estiver bloqueada.
