# CI de integração entre frontend e backend

Status: implementado e validado localmente em 18/10/2026; validação e publicação nos dois repositórios em andamento. Decisões confirmadas pelo usuário. Contrato compartilhado em [contrato.md](contrato.md) e evidências em [validacao.md](validacao.md).

## Problema

Existe uma jornada com navegador, API e PostgreSQL reais, mas ela não está automatizada entre os dois repositórios. Checks isolados não demonstram que o consumidor e o contrato HTTP funcionam juntos.

## Solução

Mudanças em qualquer um dos projetos acionam verificação integrada, com revisões identificadas dos dois projetos e ambiente descartável de teste.

## Histórias de usuário

1. Como contribuidor do frontend, quero validar meu PR contra a API.
2. Como contribuidor do backend, quero verificar o impacto da mudança na interface.
3. Como mantenedor, quero saber os dois commits exatos usados em uma execução.
4. Como contribuidor de uma feature coordenada, quero escolher explicitamente o commit correspondente do outro projeto.
5. Como mantenedor, quero isolar testes e dados de cada execução.
6. Como mantenedor, quero investigar falhas sem repetição automática que esconda instabilidade.

## Decisões de implementação

- Acionar integração em pull requests e pushes na main de ambos os projetos.
- O projeto que originou a execução usa a revisão da mudança em avaliação; por padrão, o outro usa sua main, resolvida uma vez para um commit imutável no começo da execução.
- Registrar os dois SHAs efetivamente executados, a origem da execução e eventual override. Distinguir SHA do PR de SHA de merge de teste quando o checkout usar este último.
- Permitir informar explicitamente um commit do outro projeto para alterações coordenadas. Essa escolha deve aparecer no resultado da execução, sem mudar silenciosamente a combinação padrão.
- Um resultado obtido contra override não demonstra compatibilidade com a main do outro projeto. A integração de mudanças coordenadas precisa respeitar essa distinção.
- Preparar os dois projetos com dependências travadas, Prisma gerado, API compilada e migrations aplicadas exclusivamente ao banco/schema de teste.
- Usar a suíte real existente `pnpm test:integration`, sem mocks HTTP, em Chromium. Manter zero retries.
- Cada execução recebe PostgreSQL próprio. Suítes que limpam o mesmo schema dentro da execução não rodam em paralelo.
- Preservar as proteções do runner contra banco indevido, portas em uso e reaproveitamento silencioso de servidores.
- Falha de setup ou de teste reprova a execução. Preservar evidência de falha e encerrar os processos criados.
- Não introduzir deploy nem usar banco, contas ou credenciais de produção.

## Estratégia de execução

Preferir que cada repositório execute seu check de integração com checkout dos dois projetos no próprio job. Isso evita depender de um evento remoto para devolver o status ao PR de origem. Centralizar o procedimento de preparação/execução quando possível, preservando o gatilho em ambos.

Na implementação, verificar o acesso real aos repositórios e as permissões disponíveis antes de escolher como fazer o segundo checkout e receber o override de commit. Não presumir que o token de um repositório lê o outro, nem executar código de PR não confiável com segredos. Caso falte acesso, registrar o pré-requisito concreto; uma simulação local não conclui a automação remota.

## Decisões de teste e aceite

- Executar a jornada preservada de consulta, agendamento, conflito, isolamento entre clientes, cancelamento e gestão, com API/PostgreSQL reais.
- Demonstrar acionamento por mudança no frontend e por mudança no backend, com status visível na execução de origem.
- Demonstrar escolha padrão da main do par e escolha explícita de commit coordenado, registrando os SHAs efetivamente testados.
- Demonstrar que uma falha integrada reprova o check e produz evidência útil.
- Não rodar suites de banco concorrentes sobre o mesmo schema; não usar dados de desenvolvimento.
- Distinguir validação local do runner de validação efetiva dos gatilhos no GitHub.

## Fora do escopo

Monorepo, deploy, alterações administrativas de proteção de branches e mecanismo automático de merge coordenado dos dois projetos.

## Dependências

Executar após o [CI do frontend](../ci-frontend/spec.md). A automação integrada deve estar disponível antes da implementação de refresh token.
