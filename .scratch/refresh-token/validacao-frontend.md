# Validação frontend — sessões e refresh token

Status: validação local concluída e branch publicada; checks remotos ainda pendentes. Esta evidência complementa `validacao-integracao.md`, cujo registro de preparação/RED é histórico e anterior ao GREEN do par atualizado.

## Evidência local

- Base de refresh frontend: `cf1c40cbdf34d3f7e54c386fc517f5ac3b2bac08` (`feat/refresh-sessions-ui`), publicada. Correção de regressão: JWTs emitidos no mesmo segundo eram idênticos; o backend passou a incluir `jti`, e a regressão exercita duas abas renovando o mesmo access rejeitado, com exatamente uma renovação efetiva e o mesmo SID.
- Contra essa implementação frontend e backend refresh `7e49cea54c3df7ebc088c3fb7f6c62bb2915cdb3`, a suíte completa da interface passou **77/77**, `--workers=1 --retries=0`, Node 24.22.0 e Chromium gerenciado. Inclui as regressões em `tests/e2e/sessions.spec.ts` e os demais fluxos de UI.
- A suíte integrada real `pnpm test:integration` passou **7/7**, sem retries, com API e PostgreSQL reais: jornada de booking original, login/restauração, renovação coalescida entre abas, logout offline, replay, CSRF e resposta de logout atrasada. O teste de duas abas comprova coalescência para o access rejeitado compartilhado; não afirma expiração JWT real do backend pelo relógio do navegador.
- A API nova com o frontend anterior também passou sua jornada original **1/1**, registrada em `validacao-integracao.md`.

## Branches e checks remotos

- Backend refresh: `feat/refresh-sessions-api`, `7e49cea54c3df7ebc088c3fb7f6c62bb2915cdb3`, PR #3: https://github.com/Lucalopezz/Projeto_Barber_API/pull/3.
- Frontend refresh: `feat/refresh-sessions-ui`, `cf1c40cbdf34d3f7e54c386fc517f5ac3b2bac08`, workflow pareado com peer backend `7e49cea`: https://github.com/Lucalopezz/Frontend_Barber_API/actions/runs/39282542008.
- Último estado remoto consultado: CI backend (architecture/lint/build/tests e integração frontend/API) `pending`; paired workflow `queued`, sem steps iniciados. GitGuardian passou. Nenhum merge/bypass foi feito enquanto os checks não ficam verdes.
