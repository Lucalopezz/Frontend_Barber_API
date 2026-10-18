# Política de cache de consultas do frontend

Status: planejado; decisões confirmadas pelo usuário em 18/10/2026. Não implementado.

## Problema

O frontend já usa React Query, mas sem uma política explícita de reutilização por tipo de dado. Invalidações precisam ser revisadas para evitar catálogo, horários, reservas e permissões desatualizados, especialmente após mutações e troca de conta.

## Solução

Organizar chaves, reutilização e invalidação do cache existente em memória, priorizando correção da jornada de consulta e agendamento. Não adicionar cache no backend nesta etapa.

## Histórias de usuário

1. Como cliente, quero reutilizar catálogo e serviços sem consultas repetidas desnecessárias.
2. Como cliente, quero receber atualização de horários ocupados por outras pessoas.
3. Como cliente, quero que cancelar ou realizar uma reserva atualize as telas relacionadas.
4. Como profissional, quero ver agendamentos e disponibilidade coerentes após alterações.
5. Como dono, quero que alterações de loja ou serviço atualizem o catálogo correspondente.
6. Como usuário, quero distinguir dados anteriores de dados atualizados quando a rede falhar.
7. Como usuário, quero que mudança de conta não exponha dados da conta anterior.
8. Como usuário, quero que ações indisponíveis desapareçam após uma mudança de permissão reconhecida pela aplicação.

## Decisões de implementação

### Reutilização

| Consulta | Política inicial |
| --- | --- |
| Barbearias e serviços | Reutilizar como atual por cinco minutos |
| Agendamentos | Reutilizar como atual por 30 segundos |
| Horários disponíveis | Reconsultar ao abrir a tela ou mudar a seleção relevante |
| Perfil e contexto de permissões | Reconsultar ao entrar na área protegida e voltar à aba |

- Valores configuráveis. Tempos de reutilização não representam garantia de que o servidor permaneceu inalterado e não são a duração da sessão.
- Cache somente em memória, sem persistência em localStorage/IndexedDB e sem Redis/cache no backend.
- Distinguir tempo em que o dado é considerado atual de retenção de consultas inativas; não usar retenção para pular as revalidações acordadas.
- As chaves incluem os parâmetros que mudam o resultado: identidade quando aplicável, barbearia, serviço, data, filtros e paginação. Uma resposta de seleção anterior não pode substituir a seleção atual.

### Invalidação e atualização

- Mutações bem-sucedidas invalidam imediatamente consultas relacionadas, sem aguardar os tempos da tabela. Consultas ativas relacionadas são revalidadas.
- Criar/cancelar/remarcar reserva ou alterar status atualiza agendamentos e horários afetados.
- Alterar expediente/folga atualiza a disponibilidade correspondente e consultas relacionadas cuja saída mudou, preservando as reservas existentes conforme a regra da API.
- Criar/editar/excluir serviço ou barbearia atualiza catálogo, detalhes, serviços, seleção e disponibilidade afetados; atualizar contexto do usuário quando a relação de propriedade mudar.
- Revisar invalidações existentes; uma lista de chaves independentes não pode ser tratada como uma única chave composta. Preferir escopo relacionado quando for confiável; invalidação mais ampla é aceitável para preservar correção.
- Horários e agendamentos recebem atualização periódica a cada 30 segundos enquanto a tela estiver visível. Suspender polling de telas ocultas/inativas.
- Atualizar consultas ativas ao recuperar conexão ou voltar à aba. Coordenar polling, eventos e consultas simultâneas para evitar solicitações duplicadas desnecessárias.
- Sem WebSocket nesta etapa. A confirmação da API continua sendo a autoridade; conflito 409 atualiza horários, remove seleção inválida e pede nova escolha.
- Logout, revogação e troca de conta cancelam/ignoram respostas antigas e limpam dados privados. Cache não concede permissão.

### Falhas e permissões

- Se já houver dados e a atualização falhar, mantê-los visíveis com indicação de falha/desatualização e opção de nova tentativa. Sem dados anteriores, mostrar erro recuperável sem inventar resultado vazio.
- Reservar exige consulta de disponibilidade bem-sucedida para a seleção atual. Após perder conexão, exigir nova atualização antes de habilitar confirmação.
- Não exigir sucesso de cada polling de fundo como garantia de reserva: a disponibilidade pode mudar imediatamente após qualquer consulta. Conflitos continuam sendo resolvidos no servidor.
- Preservar os campos preenchidos durante falhas; não manter como válida uma seleção removida, incompatível ou de outra identidade.
- Em 403, atualizar perfil e contexto de acesso, remover ações que os dados atualizados indiquem indisponíveis e explicar a negativa. Não deslogar nem repetir a ação negada automaticamente.
- Um 403 específico de propriedade não significa necessariamente mudança global de papel; não revogar ações sem evidência no contexto atualizado.
- Se a revalidação de permissões falhar, não ampliar o acesso nem entrar em loop. A decisão efetiva continua pertencendo ao backend.

## Decisões de teste e aceite

- Seguir TDD em comportamentos novos e correções. Usar os testes de navegador existentes com respostas controladas para observar quantidade/momento de chamadas, dados exibidos e ações habilitadas.
- Controlar relógio e respostas assíncronas para testar cinco minutos, 30 segundos, foco, reconexão, falha e respostas fora de ordem sem sleeps longos.
- Cobrir reutilização de catálogo, separação por filtro/página, refetch ao mudar seleção e polling apenas com tela visível.
- Cobrir invalidação após criar, editar e excluir loja/serviço, alterar disponibilidade e realizar/cancelar/remarcar reserva.
- Cobrir erro com e sem dados anteriores, nova tentativa, formulário preservado e confirmação bloqueada após perda de conexão até atualização bem-sucedida.
- Cobrir resposta 403, contexto atualizado, ausência de logout e ausência de repetição automática da ação negada.
- Cobrir troca de conta e resposta atrasada sem exposição ou restauração dos dados anteriores.
- Preservar a jornada integrada com API/PostgreSQL reais para verificar conflito concorrente e atualização de horários.
- Executar `pnpm lint`, `pnpm build`, `pnpm test:e2e` e `pnpm test:integration` no ambiente apropriado, sem suites concorrentes limpando o mesmo schema.

## Fora do escopo

Cache no backend, Redis, modo offline de escrita, persistência local de consultas, WebSocket, novas regras de autorização e mudança das políticas de reserva.

## Dependências e notas adicionais

Executar após [sessões e refresh token](../../../Projeto_Barber_API/.scratch/refresh-token/spec.md), reutilizando sua identidade e seus eventos de saída/troca de conta. A constatação sobre invalidações existentes orienta a regressão futura; não foi corrigida nesta sessão de planejamento.
