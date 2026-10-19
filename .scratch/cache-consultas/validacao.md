# Validação — política de cache de consultas

Status: implementação concluída e integrada à `main` pelo [PR #6](https://github.com/Lucalopezz/Frontend_Barber_API/pull/6), merge `26d0b9c`, após checks aprovados. A evidência RED/GREEN abaixo registra a implementação inicial; após atualizar a branch sobre o refresh aprovado, lint, build e 78/78 testes de interface passaram, além do check integrado do PR.

## RED/GREEN observado

- **Catálogo e serviços:** os testes Playwright de reutilização por cinco minutos/expiração e falha de revalidação foram executados primeiro contra o comportamento anterior e falharam nos requisitos de cache/estado stale; passaram após a política e as telas de erro recuperável. Os dois testes em `tests/e2e/cache-catalog.spec.ts` cobrem reutilização/expiração e preservação de detalhe com retry.
- **Agendamentos e disponibilidade:** regressões em `tests/e2e/booking.spec.ts` foram executadas antes da implementação e falharam para polling de 30 segundos, partição de chaves pelos parâmetros/identidade e falha de disponibilidade que deve preservar o formulário e bloquear a confirmação. Após a implementação passaram; a regressão de 409 e os fluxos de reserva existentes também permaneceram verdes.
- **Perfil e permissões:** em `tests/e2e/auth.spec.ts`, o cenário de 403 falhava no comportamento anterior por redirecionar/deslogar em vez de atualizar contexto sem repetir a mutação; após a correção, confirmou revalidação única e ausência de logout/repetição. A regressão de falha ao revalidar perfil também foi forçada contra o comportamento anterior e passou com retenção do dado conhecido, aviso e retry.
- **Estados stale do catálogo/detalhe:** as regressões adicionadas em `tests/e2e/cache-catalog.spec.ts` foram executadas antes do ajuste e falharam por ausência do aviso/retry mantendo a visão conhecida; passaram após os ajustes em início, reserva e gestão de loja.

Os ciclos acima foram observados pelos implementadores das frentes; não se afirma RED quando a evidência não foi preservada como log versionado. Testes controlam relógio/respostas quando pertinente.

## Gates locais agregados

Checkout `.worktrees/cache-front`, branch `feat/cache-consultas`, HEAD `ccd8d522342eea7fdbee72d9ed67ae31b3908fc3`; base refresh frontend `cf1c40cbdf34d3f7e54c386fc517f5ac3b2bac08`. Node `24.22.0`, Chromium gerenciado em `/tmp/barber-ci-browsers`.

- `pnpm lint`: aprovado.
- `pnpm build`: aprovado; apenas avisos de anotação Rollup/chunk preexistentes.
- `pnpm exec playwright test --workers=1 --retries=0`: **77/77 aprovados**, 2m30s.
- `pnpm test:integration`: **7/7 aprovados**, 34,9s, API e PostgreSQL reais, um único owner do schema de testes.
- `git diff --check`: aprovado antes dos commits finais.

A suíte integrada real valida a compatibilidade do frontend/cache sobre o par de sessões publicado; não é uma medição de cache em produção nem substitui os testes de rede controlada da UI.

## Publicação: fotografia anterior ao merge

- Branch cache publicada: [`feat/cache-consultas`](https://github.com/Lucalopezz/Frontend_Barber_API/tree/feat/cache-consultas), HEAD acima. Commits de implementação: `5201098`, `2fb7466`, `3dbefe2`, `ccd8d52`; contrato: `8b73161`.
- PR backend refresh #3: https://github.com/Lucalopezz/Projeto_Barber_API/pull/3. Na última consulta registrada, `Architecture, lint, build and tests` e `Frontend and API / Jornada com API e PostgreSQL` estavam pending; GitGuardian passou.
- Workflow pareado: https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39282542008, head `cf1c40cbdf34d3f7e54c386fc517f5ac3b2bac08`; estado `queued`, job sem steps iniciados (atualizado em 19/10/2026 16:03:53 UTC).
- PR de cache não aberto: a branch está empilhada sobre o refresh frontend ainda não integrado. Nenhum merge ou bypass foi feito; abrir contra `main` antes de resolver essa dependência poderia executar a validação sobre backend incompatível.
