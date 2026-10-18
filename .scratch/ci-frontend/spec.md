# CI independente do frontend

Status: concluído e validado localmente e no GitHub Actions em 18/10/2026, no PR #1. Evidências e limites em [validacao.md](validacao.md).

## Problema

O frontend já tem lint, build e testes de interface, mas não tem workflow de CI próprio. Mudanças podem chegar à main sem essas verificações automatizadas.

## Solução

Executar as verificações existentes no GitHub Actions em cada pull request e em pushes para main. Esta entrega usa API controlada nos testes de interface; a integração real pertence à entrega seguinte.

## Histórias de usuário

1. Como mantenedor, quero identificar erros de lint antes de integrar uma mudança.
2. Como mantenedor, quero saber se TypeScript e o bundle compilam.
3. Como mantenedor, quero executar toda a suíte de interface em Chromium.
4. Como mantenedor, quero investigar falhas com os traces correspondentes.
5. Como contribuidor, quero que uma falha reprove a execução sem ser escondida por repetição automática.

## Decisões de implementação

- Criar workflow próprio do frontend, disparado por pull requests e pushes na main.
- Instalar dependências com `pnpm install --frozen-lockfile`, respeitando os manifests e lockfile do projeto.
- Usar versão de Node compatível com os dois projetos para facilitar a integração subsequente; preservar a versão de pnpm declarada.
- Executar `pnpm lint`, `pnpm build` e toda a suíte `pnpm test:e2e` em Chromium.
- Instalar navegador e dependências de sistema necessários no runner; não depender de executável existente na máquina do usuário.
- Não iniciar backend ou PostgreSQL nesta primeira entrega. Usar o servidor isolado e respostas HTTP controladas já presentes na suíte.
- Qualquer falha obrigatória reprova o workflow. Manter zero retries e rejeição de testes exclusivos no CI.
- Disponibilizar traces das falhas como artefatos, inclusive quando a etapa de testes falhar. Evitar publicação de tokens, segredos ou artefatos de contas reais.
- Usar permissões mínimas, timeout e cancelamento de execuções obsoletas da mesma referência, sem cancelar verificações de outras referências.
- Não usar cache de resultado para omitir testes. Cache de dependências pode acelerar a instalação.
- O check verifica a mudança; proteção administrativa da main não é alterada automaticamente nesta entrega.

## Decisões de teste e aceite

- Uma execução em runner limpo instala dependências e passa lint, build e toda a suíte de interface restante após a remoção do assistente.
- Uma falha em qualquer verificação resulta em execução reprovada; falha de navegador permite obter o trace.
- Validar os gatilhos e a sintaxe do workflow, sem introduzir testes que apenas repetem seu texto.
- A documentação distingue testes com API controlada de integração real.
- Validação local não é apresentada como prova de execução no GitHub; registrar separadamente o que foi de fato executado.

## Fora do escopo

Integração real, deploy, publicação do site, ampliação para outros navegadores e mudanças no produto.

## Dependências e notas

Executar após a [remoção do assistente](../../../Projeto_Barber_API/.scratch/remocao-assistente/spec.md). A [integração entre repositórios](../integracao-ci/spec.md) é uma entrega separada e posterior.
