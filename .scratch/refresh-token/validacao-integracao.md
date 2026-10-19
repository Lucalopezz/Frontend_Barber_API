# Validação integrada de sessões — preparação

Status: registro histórico da preparação e do RED funcional contra o par anterior. O GREEN posterior da integração real foi 7/7; consulte [validacao-frontend.md](validacao-frontend.md). O coordenador liberou o schema exclusivamente para esta execução, e o runner iniciou/encerrou sua própria API e Vite.

Checkout de teste: `.worktrees/refresh-verification`, branch `test/refresh-session-browser`, base frontend `31d64dd9b0adf55b0276b7b1155c202e4018ebb2`. Contrato consultado no backend `.scratch/refresh-token/contrato.md`, revisão `30578e1`.

## Cenários versionáveis

Arquivo `tests/integration/sessions.real.spec.ts`:

1. Login real, atributos do cookie HttpOnly/local HTTP e ausência de tokens persistidos; restauração após reload e após criar novo contexto apenas com cookies persistidos.
2. Duas abas: avanço exclusivo do Date do navegador até a expiração conhecida pelo cliente, uma renovação efetiva antes das consultas e logout sincronizado. O relógio do servidor não avança; não é prova de JWT expirado no backend.
3. Falha de transporte somente da API durante logout, preservando acesso ao Vite para reload; bloqueio local, sessão ainda ativa no servidor e revogação antes de login de outra conta na reconexão.
4. Replay real de refresh consumido: a sessão correspondente é revogada e um contexto independente do mesmo usuário permanece conectado.
5. Fetch real do navegador sem header CSRF em refresh/logout: rejeição sem consumir/revogar a sessão, seguida de restauração válida.
6. Protocolo de cookies: resposta real atrasada de logout HTTP direto da sessão A chega após login B e não remove o cookie B. O fetch direto fica fora do coordenador do frontend; esse cenário não afirma que login possa ultrapassar uma barreira de logout pendente.

As falhas de transporte e o atraso de resposta são injeções controladas. Os sucessos e respostas de domínio vêm da API real, sem mocks de dados HTTP. Cada fixture usa conta UUID; cleanup remove somente seus usuários, com guard de `NODE_ENV=test` e schema exatamente `barber_api_test`. As relações de sessão precisam permitir a mesma limpeza usada pela jornada anterior do frontend `main`.

## Preparação e verificações já executadas

- Node 24.22.0: checksum SHA-256 do tarball local corresponde à lista oficial já disponível no ambiente.
- `pnpm install --frozen-lockfile --offline`, store compartilhado e instalação própria na worktree, sem alterar lockfile.
- Chromium gerenciado disponível em `/tmp/barber-ci-browsers`; navegador ainda não executado nesta tarefa.
- ESLint do arquivo de teste aprovado.
- TypeScript strict isolado do arquivo de teste aprovado, com tipos Node e DOM.
- `git diff --check` aprovado.

Ainda não é evidência RED/GREEN. O coordenador deve liberar uso exclusivo do schema antes da execução contra a implementação anterior e, depois, contra o par de implementações novas. Traces e logs devem ficar fora do Git; não registrar valores de access/refresh tokens.

## RED real observado em 19/10/2026

- Backend anterior: `16e61957c0838c72e1e473752d9511c49758d180` (`Projeto_Barber_API` main).
- Frontend anterior: `31d64dd9b0adf55b0276b7b1155c202e4018ebb2`, nesta worktree, acrescido exclusivamente dos novos testes.
- Destino conferido sem expor credenciais: `NODE_ENV=test`, host `localhost`, porta `5450`, schema exatamente `barber_api_test`. Portas 3002 e 5175 livres antes da execução.
- Comando: `BARBER_API_DIR=/home/lucaslopes/Projects/barber/Projeto_Barber_API PLAYWRIGHT_BROWSERS_PATH=/tmp/barber-ci-browsers CI=true pnpm exec playwright test --config playwright.integration.config.ts tests/integration/sessions.real.spec.ts -g 'real login restores' --output=/tmp/refresh-sessions-baseline-red-results`, usando Node 24.22.0 e removendo overrides herdados de ambiente.
- Resultado: **1 teste falhou na asserção funcional esperada**, sem falha de setup. Login real respondeu 201 e entregou access token, mas `typeof session.sessionId === "string"` resultou false. O contrato de sessão ainda não existe na implementação anterior.
- Conta UUID criada e removida pelo cleanup restrito da suíte. Não foi executado reset ou migration nesta etapa.
- Log: `/tmp/refresh-sessions-baseline-red.log`; trace/artefatos: `/tmp/refresh-sessions-baseline-red-results`, fora do Git.
- Somente esse cenário foi executado; os outros cinco aguardam o par novo. Ainda não afirmar GREEN nem cobertura integrada aprovada.

## Compatibilidade backend primeiro — jornada original

Em 19/10/2026, após nova liberação exclusiva do schema pelo coordenador:

- API nova: `73ff97f634f09e4bfc91d2329707749f44b56e23`, checkout `.worktrees/refresh-back`, build preparado pelo implementador.
- Aplicativo frontend anterior: base `31d64dd9b0adf55b0276b7b1155c202e4018ebb2`, checkout `.worktrees/refresh-verification` em `3b47275853709b40bb49b006641ab0937943a114`; alterações desse último commit são somente novos testes/relatório. `booking.real.spec.ts` permanece original.
- Ambiente conferido: `NODE_ENV=test`, host `localhost`, porta 5450 e schema exatamente `barber_api_test`. Portas 3002/5175 livres antes do runner. Sem migration/reset nesta verificação.
- Comando: `BARBER_API_DIR=/home/lucaslopes/Projects/barber/.worktrees/refresh-back PLAYWRIGHT_BROWSERS_PATH=/tmp/barber-ci-browsers CI=true pnpm exec playwright test --config playwright.integration.config.ts tests/integration/booking.real.spec.ts --output=/tmp/refresh-back-old-front-results`, Node 24.22.0, overrides herdados de ambiente removidos.
- **Resultado: 1/1 jornada original aprovada, zero retries**, em 13,2 segundos. Consumidor anterior continua usando login 201 e Bearer; campos extras de sessão não quebraram a jornada de catálogo, configuração de expediente/folga, agendamento, conflito, isolamento, cancelamento, remarcação e conclusão. Cleanup original dos usuários também passou com as novas relações de sessão.
- Log `/tmp/refresh-back-old-front.log` e diretório de resultados `/tmp/refresh-back-old-front-results`, fora do Git.

Isso comprova a compatibilidade observada com o frontend anterior para a ordem de publicação proposta; não substitui o GREEN das seis novas jornadas com o frontend atualizado.
