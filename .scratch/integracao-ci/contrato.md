# Contrato de implementação — CI integrado

Definido em 18/10/2026 antes de dividir frontend/backend. Complementa a spec aprovada sem alterar comportamento do produto.

## Workflows e responsabilidades

- Frontend hospeda `.github/workflows/integration.yml`, com `pull_request`, push na `main`, `workflow_dispatch` e `workflow_call`.
- Backend acrescenta `.github/workflows/integration.yml`, com os mesmos gatilhos automáticos/manuais, chamando o workflow do frontend por SHA completo e imutável. O SHA será preenchido pelo integrador depois de publicar o workflow compartilhado; não publicar placeholder.
- `peer_sha`: único input opcional string, disponível em dispatch/call. Vazio seleciona a `main` do outro projeto; preenchido aceita somente SHA hexadecimal completo de 40 caracteres, validado e resolvido no repositório correspondente. Não aceitar nomes de branch como override.
- Cada repositório tem seu check de integração, sem eventos dispatch enviados ao outro e sem dependência de um status remoto chegar ao PR.
- No workflow reutilizado, `github.repository`, `github.sha`, `github.event_name` e o payload de PR são do chamador. Allowlist fechada para `Lucalopezz/Frontend_Barber_API` e `Lucalopezz/Projeto_Barber_API`.
- O reusable usa o SHA do chamador como revisão de origem. Em PR, registrar também o SHA do head, distinguindo-o do SHA de merge de teste. O peer é resolvido uma única vez no início e ambos os checkouts usam os SHAs resultantes.
- O workflow deve ser autocontido: não depender de um script novo existir no frontend selecionado como peer, pois overrides podem escolher versões anteriores do app.

## Execução compartilhada

- Ubuntu 24.04, Node 24, pnpm declarado no frontend; lockfiles congelados dos dois projetos. Sem mudança de versão/lockfile.
- `actions/checkout` com credenciais não persistidas e paths fixos `frontend`/`backend`. Verificar que `git rev-parse HEAD` de cada checkout corresponde ao SHA resolvido.
- Preparação de pnpm lê `frontend/package.json`; cache de dependências considera os dois lockfiles. Instalação própria nos dois paths.
- PostgreSQL 15 como service container exclusivo de cada job, porta local 5450, banco `barber_api` e schema `barber_api_test`. Sem Compose do ambiente do usuário no CI.
- Gerar env exclusivos do job a partir do exemplo de teste do backend, com JWT aleatório. Nunca sobrescrever arquivos existentes. Usar `NODE_ENV=test`, URL local e schema de teste; validar destino antes de migrar. `.env.development` necessário ao comando Prisma generate também deve apontar para o banco de teste nesse job.
- Gerar Prisma, aplicar apenas migrations existentes de teste e compilar API. Compilar frontend e instalar Chromium com dependências no runner.
- Executar `pnpm test:integration` no frontend com `BARBER_API_DIR` absoluto para `backend`. Preservar runner atual: portas 3002/5175, servidores próprios, worker único, zero retries, sem mocks HTTP e sem reaproveitar servidores.
- Não executar suítes da API que limpam o schema junto da jornada de navegador. Os workflows de CI existentes continuam independentes e cada job tem seu próprio service container.

## Evidência, permissões e falhas

- Somente `contents: read`, sem `secrets: inherit`, PAT, deploy ou configurações administrativas de proteção de branch.
- Usar actions já verificadas: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`, pnpm `ea17c68df8912ef543352723c149a84f56e3d413`, setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1`, upload-artifact `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- Token padrão de leitura apenas no passo que consulta a API pública do GitHub para resolver o peer; não disponibilizar credenciais do usuário aos comandos dos projetos. Inputs passam por env e validação, sem interpolação em comandos shell.
- Registrar no log e job summary os dois SHAs, origem, evento, head do PR e seleção default/override. Guardar JSON de revisões em path do runner e verificar os checkouts efetivos.
- Artefato por execução com JSON das revisões, inclusive em falha quando existir, e traces de falhas do frontend. Retenção curta de sete dias. Upload não deve impedir a evidência quando o teste falhar.
- Timeout explícito, sem `continue-on-error`. Concorrência apenas no workflow compartilhado; o wrapper backend não duplica o mesmo grupo. Separar por repositório/workflow/ref/evento/peer quando aplicável.
- Não escrever testes que espelham YAML. Configuração de infraestrutura será validada por actionlint, revisão independente, execuções reais e comportamento de seleção/erro. Não alegar TDD de produto sem ciclo observado.

## Validação e publicação

- Validar localmente uma jornada real, serializada com demais testes do schema.
- Publicar PRs nos dois repositórios, incluindo os commits de remoção do backend ainda locais. O usuário autorizou a implementação e merge se todos os checks passarem.
- Mostrar no GitHub execuções acionadas por PRs e pushes dos dois projetos. Após o workflow estar na main, testar dispatch com commit explícito e entrada inválida em branch de validação, sem tornar a main intencionalmente vermelha.
- PRs só podem ser mergeados com checks aprovados da última revisão e sem bypass administrativo. Não começar refresh token ao terminar: resumir e pedir autorização para a próxima spec.
