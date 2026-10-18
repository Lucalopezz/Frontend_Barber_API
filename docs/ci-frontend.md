# CI do frontend

O workflow [Frontend CI](../.github/workflows/ci.yml) executa em cada pull request e push na `main`; também permite execução manual pela aba Actions. O check `Lint, build e interface` usa Ubuntu 24.04, Node 24 e o pnpm declarado no `packageManager` do projeto. As actions estão fixadas por commit, com a versão correspondente em comentário.

A execução instala o lockfile congelado, roda lint e build, instala o Chromium com suas dependências de sistema e executa toda a suíte `pnpm test:e2e --workers=2`. O Playwright inicia seu próprio Vite, intercepta as chamadas HTTP com dados fictícios e não precisa de API, Docker, PostgreSQL ou secrets. Não configure `PLAYWRIGHT_BASE_URL` nem `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` no runner: ele deve usar o servidor isolado e o navegador instalado pelo próprio Playwright.

O cache acelera somente a instalação das dependências, sem dispensar verificações. A suíte continua com zero retries, traces retidos em falha e rejeição de `test.only` no CI. Qualquer falha reprova o job; nenhum passo obrigatório ignora erros. Execuções anteriores do mesmo workflow e referência são canceladas quando substituídas por uma nova, e referências diferentes não se cancelam. O job tem limite de 15 minutos e permissão somente de leitura do conteúdo.

## Investigar uma falha

1. Abra o run na aba Actions e veja o primeiro passo com falha.
2. Para falhas de navegador, baixe o artefato `frontend-interface-failure-<run_id>-<run_attempt>`. O upload ocorre mesmo quando o passo de testes falha, se tiver produzido arquivos em `test-results/`; a retenção é de sete dias.
3. Extraia o artefato e abra um trace com `pnpm exec playwright show-trace /caminho/trace.zip`. Use apenas contas fictícias nessa suíte; traces podem conter os dados usados no teste.
4. Reproduza localmente com os comandos abaixo. Uma falha de instalação ou do próprio processo pode não produzir trace; nesse caso, use o log do passo.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm exec playwright install chromium
CI=true pnpm test:e2e --workers=2
```

Em uma máquina Linux sem as bibliotecas do navegador, consulte a preparação de Playwright; no runner, o workflow instala essas bibliotecas com `--with-deps`. Os detalhes da suíte estão em [tests/e2e/README.md](../tests/e2e/README.md).

Este workflow cobre a interface com API controlada. A integração com API e PostgreSQL reais tem [workflow entre repositórios](ci-integracao.md) e [procedimento local](../tests/integration/README.md) próprios. O workflow não configura deploy nem proteção administrativa da `main`.

## Estado da validação

A entrega passou em análise do workflow, validação local e execução no [GitHub Actions pelo PR #1](https://github.com/Lucalopezz/Frontend_Barber_API/pull/1). O [relatório da entrega](../.scratch/ci-frontend/validacao.md) distingue essas evidências e o teste local de retenção de traces. Configurar um check como obrigatório na proteção de branch exige uma decisão administrativa separada.
