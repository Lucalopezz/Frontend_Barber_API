# Sessões na interface

Contrato ativo: `POST /users/login` (201) e `POST /auth/refresh` (200) retornam `accessToken`, `sessionId`, `accessTokenExpiresAt` e `sessionExpiresAt`. `POST /auth/logout`, com `{sessionId}`, retorna 204. Os caminhos têm prefixo `/api/v1`. O contrato completo fica no backend em `.scratch/refresh-token/contrato.md`.

## Onde fica cada informação

O access token existe apenas na memória de cada aba. `src/auth/session.ts` elimina o antigo `localStorage.token` e não grava credenciais em localStorage/sessionStorage. O refresh token vem em cookie HttpOnly `barber_refresh_<SID>`, gerenciado pelo servidor; o JavaScript não lê seu valor.

`localStorage['barber.session.v1']` guarda somente metadados sem capacidade de autenticar: SID, geração da identidade, permissão de descoberta inicial, operações de logout pendentes e marcador de limpeza de rascunho. O SID sozinho não autentica uma chamada. Metadados malformados bloqueiam a restauração e exigem resolver a saída antes de um novo login.

`sessionStorage['barber.booking.draft.v1']` contém o rascunho da reserva e eventual resultado incerto, limitado ao usuário, loja e ID da remarcação. Não contém tokens. Expiração/rede preservam os campos; logout e troca de conta impedem reaproveitar dados privados de outra pessoa. O rascunho dura naquela aba até ela ser fechada, limpo ou substituído.

## Restauração, renovação e abas

Antes de renderizar uma rota protegida, o provider tenta recuperar a sessão. Se existe um SID local, usa somente ele. No primeiro contexto, sem metadados, pede ao servidor a única sessão autenticada pelos cookies presentes. Múltiplas sessões exigem login; a interface não escolhe uma conta.

Web Locks serializam login, refresh e logout na mesma origem. BroadcastChannel compartilha snapshots de access token apenas entre memórias das abas. Uma aba que aguarda o lock consulta o snapshot atualizado antes de renovar, evitando repetir a rotação já feita por outra aba. Gerações e SID são revalidados dentro do lock e após cada resposta. Navegadores sem essas APIs recebem uma explicação recuperável.

O Axios central injeta o Bearer atual e envia credenciais e `X-Barber-Session: 1`. Token sabidamente expirado renova antes de despachar a operação. Somente 401 com `AUTHENTICATION_REQUIRED` permite uma renovação e uma repetição. A segunda rejeição encerra a sessão. 403, falha de conexão e timeout não disparam esse retry. Login/refresh/logout não interceptam a própria falha.

Indisponibilidade bloqueia o conteúdo protegido e oferece recuperação explícita. Uma resposta de refresh perdida não é repetida automaticamente. Expiração/revogação redireciona para login, com aviso único. Respostas antigas, inclusive consultas privadas, não podem atualizar a identidade nova; as queries anteriores são canceladas e o cache privado é limpo.

## Sair e trocar de conta

Sair publica a barreira durável e limpa o acesso local antes de aguardar lock/rede. Se o servidor estiver indisponível, a interface informa que a revogação está pendente. Recarregar não restaura a sessão que foi encerrada localmente.

Ao reconectar, a pendência é resolvida antes de restaurar ou criar outra sessão. Cada confirmação remove somente sua operação. Se o logout ocorreu durante um login/restauração sem SID conhecido, o marcador de saída desconhecida identifica os cookies apenas para revogá-los; não autentica a interface. SIDs comprovados em uma resposta ambígua são revogados individualmente. Uma resposta atrasada com SID também entra na fila de revogação. Descoberta automática permanece desabilitada após saída explícita.

Troca de senha bem sucedida encerra a autenticação da aba atual e das outras abas; o backend revoga todas as sessões na mesma transação da senha.

## Reserva com resposta incerta

O formulário persiste os campos antes de qualquer transição de autenticação e revalida usuário/horários ao retomar. Antes de uma mutação, grava a tentativa pendente, protegendo também um reload durante o envio.

Se houver timeout/perda de resposta, consulta todas as páginas das reservas autorizadas. Uma criação deve corresponder ao usuário, loja, serviço e instante; uma remarcação usa também o ID autorizado do agendamento. Apenas um resultado inequívoco anuncia confirmação. Zero resultados, múltiplos resultados ou falha na consulta preservam o estado incerto e bloqueiam reenvio, inclusive após reload. O usuário pode consultar novamente e revisar seus agendamentos.

Uma falha comprovadamente anterior ao adapter do Axios usa `RequestNotSent`: nesse caso não houve mutação na rede, então o rascunho pode ser retomado após recuperar a sessão, sem falsa incerteza. A ausência genérica de resposta nunca é usada como prova de que o servidor não executou a operação.

## Ambiente e testes

Use o mesmo hostname na UI e API: ambos `localhost` ou ambos `127.0.0.1`. A API deve permitir a origem exata do frontend, credenciais e o header próprio. Não use wildcard CORS nem `SameSite=None` como atalho para desenvolvimento. `VITE_*` é público.

`pnpm test:e2e` usa API simulada e Chromium em 5174, sem PostgreSQL. `tests/e2e/sessions.spec.ts` cobre coordenação, persistência, falhas e respostas atrasadas; `booking.spec.ts` cobre retomada e reconciliação. A jornada `pnpm test:integration` usa API/PostgreSQL reais e deve ser executada sequencialmente com as suites do backend que limpam `barber_api_test`.
