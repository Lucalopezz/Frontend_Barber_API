# Regressões de autenticação

A suíte abre a aplicação no Chromium e intercepta todas as chamadas de API. Usa contas e tokens fictícios, sem API, Docker ou banco de dados.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:e2e
```

O comando inicia e encerra um Vite isolado em `127.0.0.1:5174`. A porta precisa estar livre. Se já houver um servidor da mesma revisão, informe sua origem:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5174 pnpm test:e2e
```

Para reutilizar um Chromium instalado no sistema, sem baixar outro navegador:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e
```

As regressões cobrem labels e autofill; bloqueio de reenvio enquanto o login está pendente; falha e nova tentativa; logout sem notificações duplicadas ou efeitos durante render; restauração após reload e troca de conta; expiração da sessão atual com mensagem após redirecionar; resposta 401 atrasada da conta anterior; e 401 do endpoint público de login sem invalidar a sessão existente.

As respostas atrasadas são controladas por promises nos testes. Não dependem do tempo de resposta de um backend real. Traces de falhas ficam em `test-results/`, ignorado pelo Git; podem conter dados da sessão de teste. Esta suíte não substitui o smoke de integração com a API real.

PS (18/10/2026): a suíte também cobre jornada de agendamento, falhas de mutações sem falso sucesso, conflito 409, paginação de lojas/serviços/agendamentos, gestão do dono, disponibilidade do profissional vinculado, edição parcial de expediente e conversão de fuso/DST. A integração real fica em `../integration/README.md` e usa `pnpm test:integration`.

PS (assistente e políticas): `assistant.spec.ts` cobre acesso autenticado, modo simulado explícito, contexto e fontes retornadas pela API, falha com nova tentativa, bloqueio de reenvio, isolamento entre sessões com resposta atrasada, texto não executável e navegação mobile. O histórico é somente local à tela. `booking.spec.ts` congela o relógio para manter as reservas no futuro e testa cancelamento pelo cliente exatamente a 24 horas, um milissegundo depois do limite e prazo expirando com a confirmação aberta. As regras de antecedência (30 minutos), horizonte (60 dias), grade (30 minutos) e preservação de reservas ao alterar disponibilidade são informadas pela interface; a API continua a autoridade dessas regras.
