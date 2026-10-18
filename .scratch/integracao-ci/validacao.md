# Validação — integração automatizada entre repositórios

Status em 18/10/2026: implementação integrada nos dois checkouts e validação local aprovada; execuções no GitHub em preparação. Não concluído.

## Implementação

- Frontend: workflow autocontido com PR, push na main, dispatch e chamada reutilizável; resolução dos dois commits, checkouts por SHA, PostgreSQL exclusivo, env de teste, builds, navegador e jornada real existente.
- Backend: wrapper com PR, push na main e dispatch, chamando o workflow do frontend por SHA imutável. O pin precisa corresponder a um commit publicado antes do push do wrapper.
- Os contextos de GitHub do reusable pertencem ao chamador, de modo que a mudança da API produz seu próprio check na API. Não são enviados dispatches para outro repositório para obter status de PR.
- Input `peer_sha` vazio resolve a main do outro projeto uma única vez; override exige 40 caracteres hexadecimais e existência no repositório esperado. O artefato distingue resolução automática e explícita, SHA de merge de teste e head do PR.
- Repositórios públicos e permissões somente de leitura, sem PAT, `secrets: inherit`, mudança de proteção de branch ou deploy.
- Artefato `integration-<run_id>-<attempt>` contém `integration-revisions.json` e traces disponíveis. É coletado mesmo em falha; retenção de sete dias.

## Isolamento do trabalho

- Frontend: worktree `.worktrees/integration-front`, branch `feat/integration-ci`, baseline `e578962`.
- Backend: worktree `.worktrees/integration-back`, branch `feat/integration-ci`, baseline `6e8afa3`.
- Contrato definido antes da divisão; cada implementador editou somente seu projeto. Integração e validação de banco coordenadas pelo responsável principal.
- Não houve mudança no código do produto, lockfiles, migrations ou configuração dos testes de navegador. As suítes de CI existentes foram preservadas.
- O PR backend também precisa publicar os commits locais anteriores de planejamento e remoção do assistente; isso será descrito no PR, sem apresentá-los como uma mudança apenas de YAML.

## Validação local executada

- `actionlint` 1.7.12 aprovado nos dois workflows; `git diff --check` aprovado.
- Sintaxe dos quatro blocos Node do workflow compartilhado conferida.
- Vinte verificações funcionais executaram os blocos reais extraídos do YAML em fixtures temporárias: seleção default das duas origens, override, rejeição de peer/repositório/SHA/head inválidos, falhas da API e SHA divergente, conferência de HEADs reais em dois repositórios Git, env com destino exclusivo de teste e permissão 0600, recusa de sobrescrita e coleta de evidência com/sem arquivos de testes.
- Nas verificações isoladas do resolver, respostas de rede foram controladas para testar os casos de erro sem credenciais reais. A autorização do token padrão entre os repositórios públicos ainda depende da execução real no GitHub.
- Jornada local real aprovada: 1/1 com Node 24.22.0, Chromium gerenciado pelo Playwright, frontend `e578962`, API `6e8afa3` e PostgreSQL local. Sem mocks HTTP, com worker único e zero retries; a limpeza se limitou às fixtures próprias do schema de teste.
- O PostgreSQL local existente foi reutilizado; nenhum volume ou dado de desenvolvimento foi removido. Os env existentes dos checkouts foram preservados.
- Configuração de infraestrutura não foi tratada como mudança de comportamento do produto: não se alega TDD de produto nem foram criados testes que apenas repetem YAML. A aceitação depende das execuções reais e das entradas/saídas observadas.

## Evidências locais

`/tmp/integration-ci-local-real.log` e `/tmp/integration-ci-functional-validation.json`. O segundo identifica as 20 verificações e o diretório de fixtures temporárias. Logs e arquivos com sessões não são versionados.

## Validação remota pendente

1. Publicar o workflow frontend e fixar seu SHA no wrapper backend, sem placeholder.
2. Abrir PRs nos dois projetos e observar seus checks integrados, além dos checks existentes.
3. Conferir artefatos e SHAs efetivamente obtidos, incluindo o commit de merge de teste dos PRs.
4. Fazer merge somente de revisões aprovadas, conforme autorização do usuário, e observar os gatilhos de push.
5. Exercitar dispatch com commit explícito e entrada inválida em revisão de validação independente da main, registrando evidências e falha esperada.

Refresh token e cache permanecem fora desta entrega. Ao concluir esta spec, resumir no chat e pedir autorização antes da próxima.
