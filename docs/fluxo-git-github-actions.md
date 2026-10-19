# Como as alterações chegam ao GitHub

Este guia explica o fluxo usado no laboratório Barber, do arquivo alterado no computador até o código validado na `main`. Os dois projetos continuam sendo repositórios independentes: [frontend](https://github.com/Lucalopezz/Frontend_Barber_API) e [backend](https://github.com/Lucalopezz/Projeto_Barber_API).

## As ferramentas

| Nome | Função |
| --- | --- |
| **Git** | Registra versões dos arquivos e permite trabalhar em branches. Funciona no computador, inclusive sem internet. |
| **GitHub** | Hospeda os repositórios e oferece revisão de mudanças e automações. |
| **`gh`** | É o programa oficial para operar o GitHub pelo terminal: abrir PRs, acompanhar execuções e fazer merges. |
| **GitHub Actions** | Executa comandos e testes automaticamente conforme os arquivos de configuração do repositório. |

Autenticar com `gh auth login` conecta o programa à conta do GitHub para operações pela API, dentro das permissões concedidas. O login não aprova automaticamente qualquer ação que um agente queira executar: o trabalho continua seguindo o escopo autorizado pelo usuário.

Neste ambiente, `git push` envia commits pela conexão **SSH** configurada para o Git. Essa autenticação e a do `gh` têm funções distintas; autenticar uma não garante que a outra esteja pronta. Não copie tokens, chaves privadas ou arquivos de sessão para documentos ou commits. Veja os comandos oficiais de [autenticação](https://cli.github.com/manual/gh_auth_login) e [verificação do login](https://cli.github.com/manual/gh_auth_status).

## Do trabalho local ao merge

```text
Definir contrato e testes
         ↓
Criar branch/worktree e alterar arquivos
         ↓
Validar localmente → registrar commits → enviar a branch
         ↓
Abrir PR → acompanhar checks → revisar o resultado
         ↓
Fazer merge na main → sincronizar a cópia local
```

Uma **branch** é uma linha de trabalho; a **`main`** é a principal. Um **commit** registra uma mudança no histórico e recebe um identificador, o **SHA**. Aqui usamos o SHA completo de 40 caracteres para selecionar revisões na integração.

Uma **worktree** é outra pasta de trabalho do mesmo repositório, com sua própria branch. Ela permite que subagentes atuem em tarefas independentes sem editar a pasta uns dos outros. Portas, processos e bancos ainda podem ser compartilhados na máquina: pastas diferentes não isolam esses recursos.

Antes de dividir frontend e backend, definimos o contrato compartilhado: endpoints, dados e comportamentos esperados. Para mudanças de comportamento, seguimos TDD: escrever um teste, observar a falha esperada, implementar a solução e refatorar mantendo o teste aprovado. A exceção visual autorizada está no [AGENTS.md](../AGENTS.md). Documentação e configuração de CI recebem verificações adequadas ao seu conteúdo, sem alegar TDD que não ocorreu.

`git add` seleciona arquivos, `git commit` registra a alteração e `git push` envia a branch. O **pull request**, ou **PR**, propõe incorporar essa branch em outra e reúne o diff, os commits e os checks. O **merge** incorpora a mudança na branch de destino.

No fluxo autorizado deste projeto, o agente prepara os commits, publica a branch, abre o PR e confere o commit exato e os checks antes do merge. Depois atualiza a cópia local. Isso descreve o procedimento adotado; não significa que uma proteção obrigatória de branch esteja configurada.

## O que o Actions executa

Os arquivos YAML em `.github/workflows/` descrevem os **workflows**. Cada execução é um **run**; cada run contém **jobs**, formados por **steps**. Um **runner** é a máquina que executa um job. Usamos máquinas temporárias do GitHub, que preparam dependências e executam os comandos configurados.

Os gatilhos são abertura/atualização de PR, push na `main` e execução manual. Uma falha obrigatória reprova o check. A automação continua funcionando sem o agente estar conectado. O código precisa estar publicado no GitHub para essas execuções remotas acontecerem.

| Validação | O que verifica |
| --- | --- |
| Frontend | Lint, build e interface no navegador com API controlada. |
| Backend | Arquitetura, regras unitárias, integração com banco e HTTP. |
| Integrada | Jornada real com frontend, API, Chromium e PostgreSQL, sem mocks HTTP. |

Na integração, cada job recebe seu PostgreSQL descartável e usa o schema `barber_api_test`. Não acessa o banco de desenvolvimento do computador. Localmente, suítes que limpam esse schema precisam rodar em sequência, mesmo em worktrees diferentes.

## Quais versões são testadas juntas

O projeto que inicia a integração usa a revisão do evento. Em PRs, ela representa o merge de teste produzido pelo GitHub; o SHA da branch do PR também é registrado.

Por padrão, a `main` do outro projeto é resolvida **uma única vez no início**. Os dois checkouts usam os SHAs completos registrados. Na execução manual, `peer_sha` permite escolher um commit publicado do outro projeto: exige exatamente 40 caracteres hexadecimais; campo vazio usa a `main`. Um teste com override comprova aquela combinação, não uma futura versão da `main`.

O workflow compartilhado fica no frontend. O backend chama uma revisão fixa desse **procedimento**, também por SHA. Esse pin escolhe a receita de execução; os SHAs dos **aplicativos** escolhem o código testado. Atualizar a receita usada pelo backend exige atualizar seu pin em outro PR. O [guia operacional da integração](ci-integracao.md) detalha comandos e isolamento.

## Acompanhar e investigar

Abra a aba **Actions** do [frontend](https://github.com/Lucalopezz/Frontend_Barber_API/actions) ou do [backend](https://github.com/Lucalopezz/Projeto_Barber_API/actions). Escolha a execução e abra o primeiro step com erro. No PR, a seção de checks leva aos mesmos resultados.

Os **artefatos** são arquivos guardados pela execução por sete dias. Na integração, incluem o JSON de revisões e, quando uma falha no navegador gera essa evidência, o **trace** do Playwright: um registro para investigar ações, tela e rede. Uma falha anterior ao navegador pode ter JSON e logs, sem trace.

Para validar o próprio CI, usamos falhas intencionais em branches temporárias, descartadas depois. Essas alterações não entram na `main`. Uma execução vermelha precisa ser investigada; apenas repetir até ficar verde pode esconder um defeito.

O merge atualiza o código da `main`. **Deploy** é outra etapa: publicar a aplicação em um ambiente acessível. Os workflows desta entrega validam o código; não configuram esse deploy.

Referências: [manual do `gh`](https://cli.github.com/manual/), [conceitos do Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) e [pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests).
