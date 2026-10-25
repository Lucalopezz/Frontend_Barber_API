# Auditoria final — notificações

Escopo: as quatro partes do plano original no backend. Email e Web Push são
extensões futuras e não fazem parte desta entrega.

## Implementação e cobertura

- Caixa privada paginada com confirmação, alteração, cancelamento e lembrete;
  snapshots anteriores, fuso da barbearia e acesso à agenda.
- Leitura confirmada pelo servidor, contador de não lidas e polling a cada
  30 segundos somente em primeiro plano.
- Cache por sessão, cancelamento de requisições e guarda de geração impedem
  respostas da conta anterior de atualizar a conta atual.
- Os 16 cenários de notificações com HTTP controlado e quatro testes Node
  cobrem carregamento, erro, vazio, paginação, leitura, polling e identidade.
- Duas jornadas com API, PostgreSQL, Redis e worker reais cobrem os eventos e
  o lembrete criado pelo cron de minuto sem navegador do cliente conectado.
  A fixture de lembrete usa exclusivamente barber_api_test, ajustando a idade
  de uma reserva própria; a aplicação gera outbox e Notification normalmente.

## Falhas encontradas e corrigidas

1. O PR #11 falhava em 768 px: logo, quatro links, sino e botão da conta
   excediam a largura do cabeçalho. A conta usa ícone nessa largura e conserva
   aria-label; uma regressão focada reproduziu RED e passou após a correção.
2. O runner real herdava servidores duas vezes porque defineConfig concatena
   arrays webServer. Agora a configuração base é espalhada uma vez. A execução
   real reproduziu a falha de bootstrap antes da correção e passou depois.
3. O CI não executava a jornada de notificações. O workflow integrado agora
   provisiona Redis e executa test:notifications depois da jornada geral,
   preservando SHAs, isolamento e artefatos. A condição de runner existente
   mantém o workflow reutilizável compatível com um checkout frontend antigo;
   o runner desta branch sempre é executado.

## Execução local de fechamento

| Verificação | Resultado |
| --- | --- |
| pnpm lint | Aprovado |
| pnpm build | Aprovado; avisos existentes de Zod/Rollup e bundle |
| pnpm test:notifications:unit | 4 aprovados |
| pnpm test:e2e --workers=2 | 100 aprovados, sem skips/retries |
| pnpm test:notifications | 2 jornadas reais aprovadas |
| git diff --check | Aprovado |

A jornada real de lembrete aguardou o cron UTC efetivo e verificou um evento
único processado, destinatário cliente, ausência na caixa do profissional,
horário no fuso da loja e preservação da confirmação histórica. A outra jornada
verificou reserva, alteração, cancelamento, leitura e isolamento das caixas.

## Integração dos repositórios

Os PRs existentes são backend #6 e frontend #11. A API deve entrar primeiro na
main. O CI padrão do frontend consulta a main da API; após essa integração, sua
execução deve ser repetida para conferir a combinação final. Uma execução com
peer_sha explícito verifica as duas branches antes do primeiro merge.

Logs, screenshots e traces locais ficam em /tmp, fora do Git. Os relatórios
anteriores registram limitações ambientais das execuções antigas; esta
auditoria usa navegador e serviços reais disponíveis nesta execução.
