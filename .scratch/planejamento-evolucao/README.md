# Evolução do Barber — decisões de 18/10/2026

Status: specs consolidadas após entrevista com o usuário. A remoção do assistente foi implementada e integrada aos checkouts, mas permanece pendente de validação completa; as demais entregas não foram iniciadas.

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

- Estas specs autorizam o planejamento; a entrevista não iniciou implementação, criação de PRs ou publicação remota.
- Implementar comportamento com TDD e regressões observáveis, seguindo as instruções de cada projeto. Falha de configuração não demonstra RED.
- Usar pnpm e os lockfiles existentes. Manter Clean Architecture/DDD, Nest/Fastify, Prisma e React/Vite existentes.
- Executar sequencialmente suítes que limpam o mesmo schema de teste. No CI, cada execução deve ter seu próprio PostgreSQL isolado.
- Preservar documentação histórica e registrar a evolução; não reescrever o backlog para registrar decisões técnicas.
- Nenhuma entrega está marcada como concluída. Resultados executados ficam no relatório da entrega; comandos e testes das demais specs continuam sendo critérios futuros.

## Andamento da execução

A remoção foi desenvolvida em worktrees independentes de frontend e backend, revisada por um terceiro agente e integrada sem commits nos checkouts principais. O backend teve RED/GREEN observado na regressão de remoção. O navegador não chegou aos cenários porque o sandbox bloqueia a abertura de portas; o banco também está inacessível. Portanto, a primeira entrega permanece em validação e não libera o início do CI do frontend. Consulte o [relatório de validação](../../../Projeto_Barber_API/.scratch/remocao-assistente/validacao.md).

O usuário pediu uma pausa ao final de cada spec, com resumo no chat e autorização explícita antes de começar a seguinte. Essa regra vale mesmo quando a próxima entrega já estiver planejada.

## Limites da consolidação

O desenho de comportamento está acordado. Detalhes executáveis — nomes finais de endpoints novos, migração de sessões, mecanismo de coordenação entre abas e mecanismo de acionamento entre repositórios — devem ser definidos na implementação dentro dos contratos destas specs. Uma mudança de comportamento exige nova discussão; uma escolha interna compatível não exige repetir a entrevista.
