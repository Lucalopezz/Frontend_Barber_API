# Barber Shop — frontend

Interface de agendamento de barbearias feita com React, TypeScript e Vite. O projeto também é usado como laboratório de estudo e ainda está em evolução. A API fica no repositório independente [Projeto_Barber_API](https://github.com/Lucalopezz/Projeto_Barber_API).

## O que funciona

- Clientes podem criar conta, entrar, procurar barbearias e serviços, escolher um horário, reservar e acompanhar ou cancelar agendamentos.
- Proprietários podem criar e editar a barbearia, administrar serviços e disponibilidade, além de remarcar e concluir atendimentos.
- O perfil permite consultar e atualizar dados da conta. A sessão é renovada pela API; consulte o [contrato de sessões](./docs/sessoes-autenticacao.md).

As reservas seguem as regras da API: antecedência mínima de 30 minutos, horizonte de 60 dias, horários em intervalos de 30 minutos e cancelamento pelo cliente até 24 horas antes. A interface informa essas regras, mas a API decide se uma operação é válida.

## Executar localmente

Use Node.js **24.9 ou superior** para executar o frontend junto da API e pnpm **12.11.2** (versão declarada em `package.json`). Prepare e inicie a API conforme o [guia do backend](https://github.com/Lucalopezz/Projeto_Barber_API/blob/main/docs/desenvolvimento.md); por padrão, ela atende em `http://localhost:3001/api/v1`.

Neste repositório:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev --host localhost --port 5173 --strictPort
```

Abra `http://localhost:5173` e crie uma conta em `/signup`. O exemplo de ambiente aponta para a API em `localhost`; mantenha o mesmo nome de host no navegador e na URL da API para que a sessão por cookie funcione. Se mudar a porta ou o host do frontend, ajuste a origem permitida pela API. Variáveis `VITE_*` são incluídas no bundle público: não coloque segredos nelas.

## Verificações

| Comando | O que verifica |
| --- | --- |
| `pnpm lint` | Regras de lint do frontend. |
| `pnpm build` | TypeScript e bundle de produção. |
| `pnpm test:e2e` | Fluxos no Chromium com respostas da API controladas, sem banco. |
| `pnpm test:integration` | Jornada com Chromium, API e PostgreSQL reais. |

Para preparar o navegador e entender o isolamento de cada suíte, consulte os guias de [testes de interface](./tests/e2e/README.md) e [integração real](./tests/integration/README.md). Os workflows de [CI do frontend](./docs/ci-frontend.md) e [CI integrado](./docs/ci-integracao.md) executam essas verificações nos pull requests e na `main`.

## Documentação

- [Diretrizes da interface](./docs/interface.md)
- [Sessões e autenticação](./docs/sessoes-autenticacao.md)
- [Fluxo de Git, PRs e GitHub Actions](./docs/fluxo-git-github-actions.md)
- [Registro histórico do ambiente e das entregas](./docs/estado-atual.md)

O assistente experimental de consultas foi removido. O registro dessa entrega permanece na documentação histórica; catálogo, serviços e agendamentos continuam acessíveis pelas telas próprias.
