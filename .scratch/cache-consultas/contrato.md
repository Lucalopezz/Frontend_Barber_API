# Contrato de implementação — cache de consultas

Base: `spec.md`, aprovado pelo usuário em 18/10/2026. Escopo: frontend React Query em memória; não alterar API nem introduzir persistência local, Redis, modo offline ou WebSocket.

## Cache e chaves

- Exportar políticas configuráveis: lojas/serviços com `staleTime` de 5 minutos; agendamentos 30 segundos. `gcTime` é retenção de queries inativas e não substitui revalidação em foco/entrada.
- Disponibilidade não recebe frescor reutilizável ao trocar ou abrir seleção: consultar ao abrir e ao mudar loja, serviço ou data. A chave inclui todos os parâmetros de resposta; a resposta anterior não pode habilitar a seleção atual.
- Chaves de dados privados incluem identidade estável (SID da sessão autenticada) e todos os parâmetros que mudam a resposta, inclusive filtros/paginação. Perfil/contexto também é isolado por identidade.
- Query keys usam hierarquia estável e invalidações por prefixo coerentes; listas de valores independentes são critérios, não partes de uma chave composta.

## Revalidação e mutações

- Ao entrar em área protegida e ao retornar à aba, revalidar perfil/contexto de acesso; ao reconectar, revalidar queries ativas.
- Agendamentos e disponibilidade atualizam a cada 30 segundos apenas enquanto a consulta correspondente está visível/ativa. Evitar polling duplicado desnecessário junto a foco/reconexão.
- Após sucesso de mutação, invalidar imediatamente todas as queries cujo resultado pode mudar. Incluir criar/cancelar/remarcar/status de reserva; expediente/folga; criar/editar/excluir loja/serviço; e alterações de propriedade/contexto. Consultas ativas relacionadas devem atualizar.
- 409 de reserva atualiza disponibilidade, remove horário incompatível selecionado e exige nova escolha. Não duplicar a ação automaticamente.

## Falhas, autorização e identidade

- Em falha de refetch com dados prévios, preservar os dados e exibir indicação clara de desatualização/falha com retry. Sem dados prévios, exibir erro recuperável e não resultado vazio fabricado.
- A reserva só pode ser confirmada com disponibilidade obtida com sucesso para a seleção e identidade atuais. Após perder conexão, exigir reconsulta bem-sucedida; polling falho sozinho não invalida automaticamente dado ainda fresco, mas nunca autoriza reservar sem confirmação atual exigida pelo fluxo.
- Preservar campos do formulário durante falha de rede; limpar seleção apenas quando ela se tornar inválida, incompatível ou pertencer a outra identidade.
- Em 403, atualizar perfil/contexto de acesso, remover ações comprovadamente indisponíveis e explicar a negativa. Não deslogar, não repetir mutação negada, não deduzir mudança global de papel de uma negação por propriedade. Falha ao atualizar contexto não amplia permissões nem gera loop.
- Logout, revogação e troca de conta cancelam/invalidam trabalho anterior e limpam dados privados; respostas antigas não podem popular ou restaurar o cache da nova identidade. Cache nunca substitui autorização do servidor.

## Verificação

- Seguir TDD e usar testes Playwright existentes com rede controlada, relógio controlado e barreiras determinísticas (sem sleeps longos). Testar TTLs, partição por filtro/página/identidade, foco/conexão, polling visível, mutações, conflitos, estados de falha, 403 e respostas fora de ordem/troca de conta.
- Preservar `pnpm test:integration` com API/PostgreSQL reais e conflito concorrente. Rodar sem outras suítes que limpem `barber_api_test`.
- Gates: `pnpm lint`, `pnpm build`, `pnpm test:e2e` e `pnpm test:integration` em Node 24+; nenhum bypass de CI.

## Critério de conclusão

Os comportamentos acima têm regressão automatizada observável, falha esperada confirmada antes da correção quando aplicável, e todos os gates locais/CI estão verdes para os SHAs exatos publicados.
