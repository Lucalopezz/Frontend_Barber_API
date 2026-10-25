# Validação frontend — notificações, parte 2

Worktree exclusiva: `.worktrees/notifications-part2-front`, branch `feat/notificacoes-parte2-front`. Dependências próprias instaladas offline a partir do store do projeto. Nenhum commit criado e nenhuma suíte de banco executada por este agente.

## Comportamento implementado

- Confirmações, alterações e cancelamentos com títulos em português; serviço e horário anteriores e novos aparecem quando houve mudança, no fuso da barbearia.
- Estado lida/não lida e ação de leitura sem atualização otimista. Falhas preservam o aviso não lido e mostram erro; sucesso atualiza as páginas em cache e revalida a contagem/lista.
- Sino com contagem acessível, selo visual limitado a `99+` e total preservado na descrição. Falha da contagem mantém o acesso à caixa e não inventa zero.
- Lista e contagem consultam a API a cada 30 segundos somente em primeiro plano. Consultas aceitam cancelamento; leitura aborta o transporte na troca de identidade e só escreve no cache quando sessão e geração continuam atuais.

## Verificações

- `pnpm lint`: aprovado.
- `pnpm build`: aprovado, com os avisos já conhecidos do Zod/Rollup e bundle maior que 500 kB.
- `pnpm test:notifications:unit`: quatro testes aprovados. RED observado antes da implementação: três falhas de comportamento e um teste aprovado. GREEN observado após implementar merge e guarda de identidade: quatro aprovados.
- Descoberta Playwright: 15 cenários de interface e uma jornada real ampliada descobertos com sucesso.
- Execução da interface: bloqueada antes dos testes porque o sandbox impede o Vite de abrir a porta 5174 (`listen EPERM`, mesma limitação da parte 1). Não há resultado de browser ou captura visual presumido.
- Jornada real, migrações e banco: não executados neste agente; dependem da coordenação da validação integrada.

Os testes UI usam a exceção visual autorizada pelo `AGENTS.md`; não se afirma RED/GREEN desses cenários enquanto o browser estiver bloqueado. O ciclo RED/GREEN observado acima é específico dos testes Node de cache/identidade.
