# Evolução do Barber — decisões de 18/10/2026

Status: todas as entregas planejadas foram concluídas, validadas e integradas à `main` dos respectivos repositórios. A revisão de UX já havia sido concluída pelo usuário; a evolução do assistente foi substituída por sua remoção.

A revisão de UX/interface da lista original está concluída. A evolução do assistente foi substituída por sua remoção completa, por decisão do usuário. As demais decisões foram confirmadas em rodadas de grilling.

## Ordem de entrega

| Ordem | Entrega | Spec canônica | Dependência planejada |
| --- | --- | --- | --- |
| 1 | Remover o assistente no frontend e backend | [Remoção](../../../Projeto_Barber_API/.scratch/remocao-assistente/spec.md) | Nenhuma |
| 2 | CI independente do frontend | [CI do frontend](../ci-frontend/spec.md) | Remoção |
| 3 | CI de integração entre os repositórios | [Integração](../integracao-ci/spec.md) | CI do frontend |
| 4 | Sessões e refresh token | [Autenticação](../../../Projeto_Barber_API/.scratch/refresh-token/spec.md) | Integração automatizada |
| 5 | Política de cache no frontend | [Cache](../cache-consultas/spec.md) | Refresh token |

As dependências acima registram a ordem acordada, não uma afirmação de impossibilidade técnica de trabalho independente. Cada spec tem uma única fonte canônica; features que atravessam os dois projetos devem produzir mudanças coordenadas nos dois.

## Regras de execução

- Estas specs começaram como planejamento; a implementação e publicação foram autorizadas em mensagens posteriores do usuário.
- Implementar comportamento com TDD e regressões observáveis, seguindo as instruções de cada projeto. Falha de configuração não demonstra RED.
- Usar pnpm e os lockfiles existentes. Manter Clean Architecture/DDD, Nest/Fastify, Prisma e React/Vite existentes.
- Executar sequencialmente suítes que limpam o mesmo schema de teste. No CI, cada execução deve ter seu próprio PostgreSQL isolado.
- Preservar documentação histórica e registrar a evolução; não reescrever o backlog para registrar decisões técnicas.
- Resultados executados ficam nos relatórios de cada entrega.

## Andamento da execução

A remoção foi desenvolvida em worktrees independentes de frontend e backend, revisada por um terceiro agente e integrada nos checkouts principais. Após uma tentativa bloqueada pelo sandbox, a validação foi retomada com execução autorizada fora dele: 35 testes de arquitetura, 169 unidades, 186 integrações e 57 testes HTTP da API, 40 testes de interface e uma jornada com API/PostgreSQL reais passaram. Consulte o [relatório de validação](../../../Projeto_Barber_API/.scratch/remocao-assistente/validacao.md).

O usuário inicialmente pediu uma pausa ao final de cada spec. Posteriormente autorizou a sequência completa, commits, publicação e merges condicionados aos checks; essas autorizações foram aplicadas às entregas seguintes.

O CI do frontend foi implementado em outra worktree, revisado independentemente e passou em actionlint, lint, build e 40 testes com Node 24 e Chromium gerenciado pelo Playwright. Uma falha temporária confirmou saída não zero e retenção do trace. O [PR #1](https://github.com/Lucalopezz/Frontend_Barber_API/pull/1) passou no GitHub Actions com 40 testes, além do check de segurança. Evidências em [validação do CI](../ci-frontend/validacao.md).

O usuário autorizou iniciar a integração entre os repositórios e fazer os merges se todos os checks passassem. O contrato foi definido antes da divisão em worktrees; os workflows foram publicados e mergeados após checks aprovados. A jornada real passou nos PRs e pushes dos dois projetos e na seleção explícita de commits pelas duas origens. Entradas inválidas e falha controlada de navegador reprovaram o check e preservaram evidências; a colisão de e-mails de uma fixture do backend foi corrigida com regressão RED/GREEN, 187 integrações e 57 testes HTTP aprovados no GitHub. A [validação integrada](../integracao-ci/validacao.md) contém PRs, runs, revisões e limites.

Sessões e refresh token foram integrados na API pelo [PR #3](https://github.com/Lucalopezz/Projeto_Barber_API/pull/3) e no frontend pelo [PR #5](https://github.com/Lucalopezz/Frontend_Barber_API/pull/5). A política de cache foi integrada pelo [PR #6](https://github.com/Lucalopezz/Frontend_Barber_API/pull/6). Os PRs tiveram checks aprovados. Uma corrida entre bootstrap anônimo e login encontrada no CI do frontend recebeu correção com regressão RED/GREEN antes do merge. Consulte [a validação frontend de sessões](../refresh-token/validacao-frontend.md) e [a validação do cache](../cache-consultas/validacao.md).

## Limites da consolidação

O comportamento e os contratos implementados estão registrados nas specs e na documentação ativa dos dois projetos. Mudanças futuras de comportamento exigem nova discussão; escolhas internas compatíveis não exigem repetir a entrevista.
