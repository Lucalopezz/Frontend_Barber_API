# Skills externas do frontend

Instaladas neste repositório em 17/10/2026, sem instalação global e sem alterar dependências da aplicação. As instruções do projeto em `AGENTS.md` e a tarefa do usuário prevalecem sobre sugestões genéricas das skills.

| Diretório em `.agents/skills/` | Nome declarado no `SKILL.md`  | Origem                                                                                                                           | Revisão fixa                               |
| ------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `playwright`                   | `playwright`                  | [OpenAI](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright)              | `49f948faa9258a0c61caceaf225e179651397431` |
| `security-best-practices`      | `security-best-practices`     | [OpenAI](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices) | `49f948faa9258a0c61caceaf225e179651397431` |
| `react-best-practices`         | `vercel-react-best-practices` | [Vercel](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices)  | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| `web-design-guidelines`        | `web-design-guidelines`       | [Vercel](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) | `063bee94c3f4df8453406c830b0a7df0f2860278` |

`skills-lock.json` registra caminhos de origem, commits completos, licenças e SHA-256 de cada arquivo instalado. As cópias mantêm integralmente os arquivos upstream; as orientações locais ficam aqui e em `AGENTS.md`.

## Uso no projeto

- Playwright: explorar login, sessão e navegação no navegador, com snapshots antes de interagir. A skill é voltada à CLI; não cria uma suíte permanente de testes automaticamente.
- React: aplicar orientações compatíveis com React 19 e Vite. Partes específicas de Next.js, React Server Components, server actions e `next/dynamic` não se aplicam a este aplicativo. Preserve a biblioteca de consultas e o roteador existentes; a skill não autoriza trocar bibliotecas.
- Web Design Guidelines: revisar os arquivos da tarefa em acessibilidade, formulários, foco, estados de carregamento e UX. A skill consulta um documento remoto atualizado a cada revisão; o commit da skill não fixa esse documento. A fonte revisada na instalação foi [`command.md` no commit `434b7f91364665f2f733b310ec54809bf8f37937`](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md), cujo hash está no lock. Registre a revisão usada quando precisar repetir uma avaliação.
- Security Best Practices: usar em tarefas explícitas de segurança e consultar as referências de TypeScript/React relevantes. A instalação não executou uma auditoria completa do sistema.

O Codex poderá descobrir estas skills locais no próximo turno/sessão aberto no repositório. Se já houver um agente em execução, informe o caminho absoluto do `SKILL.md` para que ele o leia explicitamente. Uma worktree criada antes de versionar `.agents/` não recebe os arquivos locais automaticamente; faça commit e crie a worktree a partir dele, ou forneça o caminho da cópia revisada ao agente.

## Playwright e pnpm

O script upstream `skills/playwright/scripts/playwright_cli.sh` foi lido antes da instalação. Ele apenas verifica `npx`, encaminha os argumentos e a sessão opcional e executa `npx --yes --package @playwright/cli playwright-cli`. Nenhum script instalado foi executado nesta instalação.

O wrapper continua intacto, mas usa npm/npx e não fixa a versão do pacote baixado. Para manter a preferência por pnpm, use a CLI diretamente com uma versão revisada:

```bash
# Substitua <versao-revisada> por uma versão conferida antes de executar.
pnpm dlx @playwright/cli@<versao-revisada> open http://127.0.0.1:5173 --headed
pnpm dlx @playwright/cli@<versao-revisada> snapshot
```

Se a CLI já estiver entre as ferramentas locais, use `pnpm exec playwright-cli`. Não adicione um pacote ou navegador ao projeto só para instalar a skill. Para usar o wrapper original, o caminho deste projeto é `./.agents/skills/playwright/scripts/playwright_cli.sh`; o exemplo upstream em `$CODEX_HOME/skills` aponta para uma instalação global diferente.

## Atualização e revisão

1. Escolha um novo SHA completo upstream e leia o diff dos `SKILL.md`, referências, scripts, licenças e links externos. Não use uma branch mutável como revisão instalada.
2. Instale em um diretório temporário com o helper de `skill-installer`, por exemplo:

   ```bash
   python /home/lucaslopes/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
     --repo vercel-labs/agent-skills \
     --path skills/react-best-practices skills/web-design-guidelines \
     --ref <sha-completo-revisado> --dest /tmp/barber-skills-review-<identificador>
   ```

3. Compare com a cópia versionada, revise compatibilidade com React/Vite e substitua somente os diretórios aprovados. O helper recusa sobrescrever um diretório existente.
4. Atualize este inventário, licenças e hashes de `skills-lock.json` no mesmo commit. O lock é um inventário verificável; nenhum gerenciador de pacotes o atualiza automaticamente. Valide o comportamento afetado e registre os checks executados.

## Licenças e revisão da instalação

As skills OpenAI incluem seus `LICENSE.txt` Apache-2.0, preservados. React declara MIT no frontmatter e a raiz do repositório Vercel declara MIT no README; a cópia original desse README foi preservada em `licenses/vercel-agent-skills-README.md`. A revisão Vercel não inclui um arquivo `LICENSE` separado; não foi criado um texto de licença ou copyright em nome do autor.

Foram conferidos os `SKILL.md`, o único script executável fornecido e a estrutura de arquivos. Não foram encontrados links simbólicos, nomes de arquivos de credenciais ou padrões de segredos reais. Exemplos de código e recomendações de segurança permanecem como dados de referência. Isso não equivale a uma auditoria de segurança dos pacotes executados futuramente pela CLI.

## PS — documentação, grilling e planejamento (18/10/2026)

Foram adicionadas seis skills locais: `docs-sync-audit`, `grill-me`, `grilling`, `to-spec`, `to-tickets` e `setup-matt-pocock-skills`. O setup aprovado usa arquivos Markdown locais; consulte [o workflow e exemplos](../docs/agents/workflow.md), [o destino de specs/tarefas](../docs/agents/issue-tracker.md) e [as fontes de domínio](../docs/agents/domain.md).

As cinco skills de Matt Pocock estão fixadas em `49dd158d1076134a641b33efb035946536778336`; `docs-sync-audit`, de `github/awesome-copilot`, em `cb64ad12e32737ae764becd6885462e9b4c7cb00`. Cada pasta preserva seus arquivos upstream. As licenças MIT originais estão em `licenses/mattpocock-skills-LICENSE` e `licenses/awesome-copilot-skills-LICENSE`; o lock registra origem, revisão e hashes.

O auditor inclui um script Python somente leitura, revisado antes da execução de verificação. As demais skills são instruções e templates; não instalaram dependências da aplicação nem configuraram serviços. A regra de uso manual e as adaptações de escopo/idioma ficam em `AGENTS.md` e `docs/agents/workflow.md`, sem alterar os arquivos upstream. Nenhuma skill global ou plugin com atualização automática foi adicionado.
