# Validação — integração automatizada entre repositórios

Status: concluído em 19/10/2026. Workflows publicados e mergeados após aprovação dos checks dos PRs; integração aprovada nas duas origens, nos pushes e nos overrides. Validações negativas conferidas e fixture instável corrigida com regressão.

## Implementação

- Frontend: workflow autocontido com PR, push na main, dispatch e chamada reutilizável; resolução dos dois commits, checkouts por SHA, PostgreSQL exclusivo, env de teste, builds, navegador e jornada real existente.
- Backend: wrapper com PR, push na main e dispatch, chamando o workflow do frontend pelo SHA publicado `af10e0d74b4649bb3f2d397ffe55587c2976fc29`. Esse pin fixa o procedimento; os SHAs dos aplicativos são resolvidos separadamente em cada execução.
- Os contextos de GitHub do reusable pertencem ao chamador, de modo que a mudança da API produz seu próprio check na API. Não são enviados dispatches para outro repositório para obter status de PR.
- Input `peer_sha` vazio resolve a main do outro projeto uma única vez; override exige 40 caracteres hexadecimais e existência no repositório esperado. O artefato distingue resolução automática e explícita, SHA de merge de teste e head do PR.
- Repositórios públicos e permissões somente de leitura, sem PAT, `secrets: inherit`, mudança de proteção de branch ou deploy.
- Artefato `integration-<run_id>-<attempt>` contém `integration-revisions.json` e traces disponíveis. É coletado mesmo em falha; retenção de sete dias.

## Isolamento do trabalho

- Frontend: worktree `.worktrees/integration-front`, branch `feat/integration-ci`, baseline `e578962`.
- Backend: worktree `.worktrees/integration-back`, branch `feat/integration-ci`, baseline `6e8afa3`.
- Contrato definido antes da divisão; cada implementador editou somente seu projeto. Integração e validação de banco coordenadas pelo responsável principal.
- Não houve mudança no código do produto, lockfiles, migrations ou configuração dos testes de navegador. As suítes de CI existentes foram preservadas; a correção de fixture descrita abaixo mantém os cenários e asserções existentes.
- O PR backend também publicou os commits locais anteriores de planejamento e remoção do assistente. Seu escopo foi descrito no PR, incluindo a remoção e suas regressões.

## Validação local executada

- `actionlint` 1.7.12 aprovado nos dois workflows; `git diff --check` aprovado.
- Sintaxe dos quatro blocos Node do workflow compartilhado conferida.
- Vinte verificações funcionais executaram os blocos reais extraídos do YAML em fixtures temporárias: seleção default das duas origens, override, rejeição de peer/repositório/SHA/head inválidos, falhas da API e SHA divergente, conferência de HEADs reais em dois repositórios Git, env com destino exclusivo de teste e permissão 0600, recusa de sobrescrita e coleta de evidência com/sem arquivos de testes.
- Nas verificações isoladas do resolver, respostas de rede foram controladas para testar os casos de erro sem credenciais reais. O acesso do token padrão aos repositórios públicos foi posteriormente comprovado pelas execuções reais nas duas origens.
- Jornada local real aprovada: 1/1 com Node 24.22.0, Chromium gerenciado pelo Playwright, frontend `e578962`, API `6e8afa3` e PostgreSQL local. Sem mocks HTTP, com worker único e zero retries; a limpeza se limitou às fixtures próprias do schema de teste.
- O PostgreSQL local existente foi reutilizado; nenhum volume ou dado de desenvolvimento foi removido. Os env existentes dos checkouts foram preservados.
- Configuração de infraestrutura não foi tratada como mudança de comportamento do produto: não se alega TDD de produto nem foram criados testes que apenas repetem YAML. A aceitação depende das execuções reais e das entradas/saídas observadas.

## Evidências locais

`/tmp/integration-ci-local-real.log` e `/tmp/integration-ci-functional-validation.json`. O segundo identifica as 20 verificações e o diretório de fixtures temporárias. Logs e arquivos com sessões não são versionados.

## Publicação e validação remota

O [PR frontend #2](https://github.com/Lucalopezz/Frontend_Barber_API/pull/2), head `af10e0d74b4649bb3f2d397ffe55587c2976fc29`, passou no CI de interface (40 testes), integração e check de segurança antes do merge `9bcfff4f4394935a900847c7b29243c0814ebbb7`.

O [PR backend #1](https://github.com/Lucalopezz/Projeto_Barber_API/pull/1), head `cbfed56557610cfd041179d3ea97e832d287bed9`, passou em arquitetura (35 testes), lint, build, 169 unidades, 186 integrações, 57 testes HTTP, jornada integrada e check de segurança antes do merge `d77f7939b10d1f167567714605ac5a559eaa3f67`. Não houve bypass administrativo.

Cada execução abaixo aprovou a jornada real 1/1. Os SHAs abreviados servem para leitura; os artefatos `integration-revisions.json` foram baixados e conferidos com os SHAs completos, `checkout_verified: true`, origem e seleção do par.

| Origem e seleção | Execução aprovada | Frontend | Backend |
| --- | --- | --- | --- |
| PR frontend, par main | [39177207119](https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39177207119) | `66f1914` (merge de teste) | `7869219` |
| PR backend, par main | [39177239670](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39177239670) | `e578962` | `47f3f84` (merge de teste) |
| Push frontend main | [39177367272](https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39177367272) | `9bcfff4` | `7869219` |
| Push backend main | [39177637512](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39177637512) | `9bcfff4` | `d77f793` |
| Dispatch frontend, override backend | [39177403369](https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39177403369) | `af10e0d` | `cbfed56` |
| Dispatch backend, override frontend | [39177658609](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39177658609) | `af10e0d` | `cbfed56` |

Os artefatos dos PRs também identificam seus heads completos, distintos dos merges de teste executados. A primeira execução do push frontend resolveu a main anterior do backend porque começou antes do merge da API; a execução do push backend validou os dois merges juntos. Os overrides foram testados nas branches publicadas da implementação e não substituem a evidência da combinação padrão.

## Falhas e diagnóstico

- **Input inválido:** [run 39177473148](https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39177473148), na revisão temporária `6313c86da4c94c4e97531c13e87f4c75837aca80`, recebeu `peer_sha=main`. Falhou como esperado no resolver antes dos checkouts e publicou JSON com `resolution_failed`, `checkout_verified: false` e o erro de formato. Não houve teste de navegador nessa execução, portanto não era esperado trace. A branch remota temporária foi removida depois da conferência; esse commit não foi mergeado.
- **Falha real do navegador:** [run 39178231324](https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39178231324), na revisão temporária `b4e2f15009a463764b337620fbef7e57bbe1de67`, executou a jornada contra backend `d77f7939b10d1f167567714605ac5a559eaa3f67`. Somente nessa branch, a asserção do cadastro de barbearia esperava deliberadamente HTTP 418 em vez de 201. O teste falhou exatamente nessa asserção, sem retry; o check ficou vermelho e preservou JSON com os dois checkouts verificados, contexto do erro e `trace.zip` (74 entradas, integridade ZIP conferida). A branch remota temporária foi removida após a conferência; a alteração intencional não foi mergeada.
- **Fixture instável do CI backend:** o [push 39177637340](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39177637340) falhou em 2/186 integrações por colisão de e-mail na criação de clientes. A fixture usava `Date.now()` e podia gerar o mesmo e-mail no mesmo milissegundo. A jornada integrada do mesmo push passou em seu job/PostgreSQL próprio. O [PR backend #2](https://github.com/Lucalopezz/Projeto_Barber_API/pull/2), head `fcfc6950530129948cfd8cd366ada4e9ce6dc0d3`, substituiu somente esse sufixo por UUID e acrescentou uma regressão que fixa o relógio e persiste dois clientes distintos. O subagente observou RED por unicidade com o helper anterior e GREEN após a mudança, em banco real, e executou lint/build, 187 integrações e 57 testes HTTP localmente. O [CI remoto 39232323770](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39232323770) aprovou arquitetura, lint, build, 169 unidades, 187 integrações e 57 testes HTTP. A [jornada integrada 39232324271](https://github.com/Lucalopezz/Projeto_Barber_API/actions/runs/39232324271) também passou 1/1; seu JSON distingue head `fcfc695` e merge de teste `04e92aa`. O merge final da correção é `16e61957c0838c72e1e473752d9511c49758d180`, feito com todos os checks verdes. Sem alteração de regras do produto ou adição de retries.

Os artefatos de integração têm retenção de sete dias. Depois disso, os links de execução ainda documentam os resultados e logs conforme a retenção do GitHub; uma nova execução resolve outra combinação se o override não for informado.

Refresh token e cache permanecem fora desta entrega. Ao concluir esta spec, resumir no chat e pedir autorização antes da próxima.
