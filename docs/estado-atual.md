# Ambiente e estado atual — 17/10/2026

O projeto de estudo incompleto passa a servir também como laboratório de IA,
skills, agentes e worktrees. O README original foi preservado com uma nota.
O backend continua no repositório independente `Projeto_Barber_API`, ao lado
deste diretório na máquina.

## Executar

Validado com Node `26.12.0` e pnpm `12.11.2`. O env local já está configurado
nesta máquina. Para uma cópia nova:

```bash
pnpm install --frozen-lockfile
cp -n .env.example .env.local
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

Abra `http://127.0.0.1:5173`. A API deve estar rodando em
`http://localhost:3001/api/v1`; essa é a variável `VITE_API_URL` do exemplo.
Variáveis `VITE_*` são públicas no bundle: não coloque chaves de IA nelas.
O backend permite CORS de `localhost:5173` e `127.0.0.1:5173`.

Crie sua conta em `/signup`: não há dados de demonstração pré-carregados.
Criar uma loja promove a conta de barbeiro para proprietário. Saia e entre
novamente após criar a loja para obter o token `owner` e gerir serviços.

## O que foi verificado

- Instalação com lock congelado, build e lint passaram.
- Chromium real validou cadastro cliente/barbeiro, login, restauração após
  reload, criação de loja, gestão/criação/listagem de serviço, troca de conta,
  listagem e cancelamento de reserva. Não houve exceção JavaScript não tratada.
- A reserva e o expediente usados nessa verificação foram criados pela API;
  as telas correspondentes ainda não existem. Dados temporários foram removidos.
- O backend aprovou 128 testes unitários, 185 de integração e 9 e2e.

Foram corrigidos rotas antigas, papel `owner`, atualização de perfil sem `role`,
filtro de serviços, PATCH de cancelamento, import do router, aplicação do token
e limpeza do cache na troca de conta. As versões antigas das dependências
foram preservadas ao importar o npm lock para pnpm.

## O que permanece incompleto

| Prioridade sugerida | Limitação                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0                  | Auditar/atualizar dependências antigas: `pnpm audit` retornou 101 registros (57 altos, 42 moderados, 2 baixos); `--prod`, 66 (32 altos, 33 moderados, 1 baixo). Não é comprovação de exploração. |
| P1                  | Botão Agendar sem ação; faltam seleção de serviço/horário, criação de reserva e configuração de expediente/folgas.                                                                               |
| P1                  | Novo login necessário após criar loja: token antigo continua `barber` e a gestão exige `owner`.                                                                                                  |
| P1                  | API retorna `500` para conflito de horário; o tratamento de erro de negócio precisa ser corrigido no backend.                                                                                    |
| P2                  | Editar reserva sem ação, alguns toasts antecipados e totais calculados sobre uma página.                                                                                                         |
| P2                  | Não há suite de frontend; build alerta para JS de 844,59 kB (gzip 246,90 kB).                                                                                                                    |
| P2                  | Tutorial `/services` menciona recursos ainda não implementados, como avaliações/favoritos/notificações.                                                                                          |

`--prod` segue as categorias atuais do package.json, que incluem ferramentas
de build em `dependencies`; não representa apenas código do navegador.
Alertas de versão de baseline e depreciação do Node também apareceram, sem
impedir o build.

## Próximos estudos

Comece por uma entrega pequena com critérios de aceite e verificação. Use um
agente para implementação e outro para revisão quando isso trouxer benefício.
Para front/back independentes, atribua uma branch/worktree e arquivos a cada
implementador; centralize a integração da jornada.

A worktree usada nesta sessão foi `../.worktrees/frontend-ai-lab`, branch
`chore/ai-lab-frontend`, commit `c3f0ce6`. Os diffs foram revisados e aplicados
ao original; documentação final e `.node-version` foram acrescentados nele.
Não foram instalados agentes permanentes. Confira `git worktree list` e
`git diff main...chore/ai-lab-frontend` para inspecionar a entrega do agente.

O relatório conjunto e o workflow completo estão em `docs/estado-atual.md` e
`docs/laboratorio-ia.md` **do repositório backend**, incluindo Docker, schemas,
prioridades e exemplos de prompts. Uma boa primeira feature de IA é consultar
catálogo e horários por ferramentas, com dados sintéticos e avaliação fixa,
mantendo autorização e disponibilidade sob responsabilidade da API.
