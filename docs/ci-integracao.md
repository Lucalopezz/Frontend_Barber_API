# CI de integração entre os dois projetos

O workflow `Integrated CI` executa a jornada existente de consulta e agendamento com Chromium, API e PostgreSQL reais, sem mocks HTTP. Ele roda em pull requests, pushes na `main` e execução manual dos dois repositórios. O frontend hospeda `.github/workflows/integration.yml`; o backend chama esse workflow por SHA imutável, mantendo o status no PR de origem. Não há deploy nem envio de eventos para outro repositório.

## Escolha das revisões

O projeto que acionou a execução usa `github.sha`. Em pull requests, esse SHA corresponde ao merge de teste do GitHub; o resumo também registra o head do PR para distinguir as revisões. Por padrão, a `main` do outro projeto é resolvida uma única vez, no início, e os dois checkouts usam SHAs completos. Antes da preparação, o workflow confere cada checkout com `git rev-parse HEAD`.

Para uma alteração coordenada, abra **Actions → Integrated CI → Run workflow** no projeto de origem, escolha a referência e preencha `peer_sha` com os **40 caracteres hexadecimais** de um commit publicado no outro repositório. Campo vazio usa a `main`. Branches, tags e SHAs abreviados são rejeitados. O mesmo input está disponível para `workflow_call`; ele sempre identifica o projeto oposto ao chamador.

Exemplo com GitHub CLI, substituindo o valor por um SHA completo do backend:

```bash
gh workflow run integration.yml \
  --repo Lucalopezz/Frontend_Barber_API \
  --ref minha-branch \
  -f peer_sha=SHA_COMPLETO_DO_BACKEND
```

O workflow precisa existir na branch padrão para execução manual. O override aparece no log, no resumo e no JSON de revisões. **Um resultado com override não comprova compatibilidade com a `main` do outro projeto**; os checks automáticos continuam usando a combinação padrão. Mudanças coordenadas precisam de uma ordem de integração que preserve essa compatibilidade.

## Ambiente e isolamento

Cada job recebe Ubuntu 24.04, Node 24, pnpm declarado no frontend e PostgreSQL 15 descartável, na porta local 5450. Instala os dois lockfiles congelados, gera Prisma Client, aplica somente migrations existentes no schema `barber_api_test`, compila os dois projetos e instala Chromium com suas dependências de sistema. Não usa Compose, env ou banco da máquina do mantenedor.

Os arquivos `.env.test` e `.env.development` são criados a partir do exemplo de teste do backend, com `NODE_ENV=test`, destino local exclusivo e JWT aleatório; arquivos preexistentes causam falha em vez de serem sobrescritos. O segundo arquivo atende ao script de geração do Prisma, apontando também para o destino de teste. Os env e o JWT não são publicados nos artefatos.

O runner preserva as portas 3002/5175, servidores próprios, um worker e zero retries da [configuração integrada](../playwright.integration.config.ts). Não reaproveita servidores existentes. A jornada não roda junto de suítes da API que limpam o mesmo schema; os CIs separados têm seus próprios jobs e bancos. O Playwright encerra os servidores iniciados por ele; o GitHub remove o service container ao terminar o job.

O timeout é de 20 minutos e qualquer falha obrigatória reprova o check. Uma execução nova cancela a anterior apenas quando repositório, workflow, referência, evento e seleção do par coincidem. A permissão é `contents: read`, sem PAT nem `secrets: inherit`. O token padrão fica restrito à consulta da API pública do GitHub e às actions de checkout, que não persistem credenciais. Comandos dos projetos não recebem credenciais do mantenedor.

## Investigar uma execução

1. Abra o job **Jornada com API e PostgreSQL** e consulte o resumo com origem, evento, modo `main`/`override` e os dois SHAs. No backend, o job aparece dentro da chamada reutilizada.
2. Baixe o artefato `integration-<run_id>-<run_attempt>`, retido por sete dias. `integration-revisions.json` registra a seleção, as revisões e se os checkouts foram conferidos. Ele é publicado também quando o setup ou a resolução falha, se chegou a ser criado.
3. Quando o teste de navegador falhar, o mesmo artefato inclui `frontend/test-results/` com o trace retido pelo Playwright. Abra o arquivo com `pnpm exec playwright show-trace /caminho/trace.zip`. Traces podem conter dados fictícios de sessão.
4. Se não houver trace, verifique o primeiro passo com erro: uma falha de checkout, dependências, migrations ou build ocorre antes do navegador. Reexecutar uma combinação exige os dois SHAs registrados; não presuma que a `main` continua no mesmo commit.

Um SHA sintaticamente válido precisa existir no repositório do par; a resolução consulta esse repositório e rejeita erro HTTP ou divergência. Somente os dois repositórios públicos Barber estão na allowlist. Não use `pull_request_target` ou segredos para executar código de PR.

O backend fixa a revisão deste procedimento em seu `uses:`. Ao mudar o workflow compartilhado, publique a revisão do frontend e atualize o pin do backend em outro PR; alterar apenas o frontend não atualiza silenciosamente o procedimento usado pela API.

O [procedimento local](../tests/integration/README.md) continua disponível para diagnóstico. A validação desta entrega e suas limitações ficam no [relatório da spec](../.scratch/integracao-ci/validacao.md). Configurar proteção de branch ou check obrigatório permanece fora do escopo.

Referências do GitHub: [workflows reutilizáveis](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) e [PostgreSQL como service container](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
