# Validação — CI do frontend

Status em 18/10/2026: implementado, revisado e validado localmente; publicação da branch e PR para execução no GitHub autorizados pelo usuário, em preparação.

O workflow está em `.github/workflows/ci.yml`; as instruções operacionais estão em [docs/ci-frontend.md](../../docs/ci-frontend.md). Não há mudanças no produto, no lockfile, na configuração do Playwright ou na integração real entre repositórios.

## Estratégia

Esta entrega automatiza verificações existentes, sem introduzir testes que repetem o YAML. Não se alega ciclo TDD RED/GREEN de produto para a criação do workflow. A validação deve analisar a sintaxe/gatilhos e executar lint, build e toda a suíte, além de provocar uma falha temporária de navegador para confirmar a retenção de trace e o resultado de saída não zero. A injeção temporária não deve permanecer no Git.

## Evidências

- Revisão estática: pull requests, push na `main`, execução manual, permissão `contents: read`, timeout de 15 minutos e concorrência por workflow/referência.
- Ambiente declarado: Ubuntu 24.04, Node 24, pnpm do `packageManager`, lockfile congelado e Chromium instalado pelo Playwright com dependências de sistema.
- Verificações declaradas: lint, build e suíte inteira com dois workers; configuração existente preserva zero retries, `forbidOnly` em CI e `retain-on-failure`.
- Falhas: nenhum `continue-on-error`; upload condicionado à falha do passo e2e, `test-results/` como origem e sete dias de retenção.
- Validação independente: um agente revisou o workflow e os documentos, sem encontrar achados concretos; não alterou arquivos nem executou servidores.
- `actionlint` 1.7.12: aprovado. Binário oficial baixado para `/tmp`, com checksum conferido; nenhuma ferramenta global foi instalada.
- Node local de validação: 24.22.0, baixado da distribuição oficial e conferido por SHA-256; pnpm 12.11.2 do projeto.
- Instalação própria em worktree limpa: 284 pacotes reutilizados do store, lockfile congelado e preservado, sem copiar `node_modules`. Repetição com `CI=true` também aprovada.
- `pnpm lint` e `pnpm build` com Node 24: aprovados. O aviso de chunk grande já existia e não motivou alteração no produto.
- `CI=true pnpm test:e2e --workers=2` com Node 24 e Chromium do sistema: 40/40 aprovados.
- Instalado também o Chromium gerenciado pela versão travada do Playwright em `/tmp/barber-ci-browsers`, sem instalar pacotes de sistema. A suíte com Node 24, `CI=true`, dois workers e sem override de executável passou em 40/40 cenários. Essa execução aproxima o navegador previsto no workflow, mas não comprova provisionamento em Ubuntu limpo.
- Injeção de falha: um teste temporário em `/tmp` herdou a configuração real de traces e retries, abriu uma página fictícia e falhou intencionalmente. O runner retornou código 1 e preservou um `trace.zip` válido, com 11 entradas. Nenhum teste temporário foi incluído no Git. Isso confirma a retenção local; o upload remoto exige uma execução no GitHub.
- Execução no GitHub Actions: ainda não executada nesta revisão do relatório. O usuário autenticou o GitHub CLI como `Lucalopezz` e autorizou publicar os commits preparados em uma branch e abrir um PR, sem merge na main. Gatilhos e artefatos remotos serão acompanhados separadamente.

## Isolamento e logs

Implementação em worktree própria `.worktrees/frontend-ci`, branch `feat/frontend-ci`, partindo do commit `970c584`. O patch foi integrado no checkout principal após revisão. Não foram alterados código do produto, dependências ou configuração do Playwright.

Logs locais, fora do Git: `/tmp/frontend-ci-actionlint.log`, `/tmp/frontend-ci-node24-{install,lint,build,interface}.log`, `/tmp/frontend-ci-chromium-install.log`, `/tmp/frontend-ci-managed-chromium-interface.log` e `/tmp/frontend-ci-failure-check.log`.

Os SHAs das quatro actions foram resolvidos e conferidos nos repositórios oficiais, sem copiar versões não verificadas. Referências: [checkout](https://github.com/actions/checkout), [pnpm](https://github.com/pnpm/action-setup), [setup-node](https://github.com/actions/setup-node), [upload-artifact](https://github.com/actions/upload-artifact) e [Playwright CI](https://playwright.dev/docs/ci-intro).

## Escopo preservado

Não foram iniciados API, Docker ou PostgreSQL para o workflow do frontend. Integração cruzada, proteção de branch, deploy e merge automático continuam fora desta entrega. O push e o PR de validação foram autorizados posteriormente pelo usuário e se limitam ao frontend.
