# Interface — direção e verificação

## Direção

Aplicativo de barbearias: encontrar um lugar, marcar horário e cuidar da agenda. Identidade inspirada em letreiros de barbearia e materiais do salão: azul de tinta #172A32, vermelho vinho #883D43, porcelana #F6F7F5, branco #FFFFFF, aço #D7DEDE e cinza #52646B. Barlow Condensed bold em títulos/assinatura; Manrope no conteúdo e controles. Fontes locais com OFL.

A primeira proposta de papel/cobre foi revisada por lembrar templates editoriais genéricos. A versão escolhida usa azul/vinho do universo de barbearia, uma ilustração vetorial de salão e títulos condensados. Sem gradientes, números fictícios, fotos de estabelecimentos inventados ou animação ornamental.

Layout: alinhamento à esquerda, largura máxima consistente, navegação desktop no topo e ações principais fixas embaixo no celular. Conteúdo útil acima da dobra. No celular, formulários em uma coluna, alvos de toque de pelo menos 44 px, diálogos com rolagem própria e espaço para áreas seguras.

```text
Desktop: [marca | encontrar | agenda              perfil]
         [título + busca                    salão ilustrado]
         [barbearia] [barbearia] [barbearia]
Celular: [marca                              conta]
         [título / busca]
         [barbearia]
         [barbearia]
         [encontrar | agenda | conta]
```

## Conteúdo

Uma ação principal por seção. Rótulos em português; estados de agendamento traduzidos. Políticas aparecem onde ajudam a decidir, com detalhes expansíveis. Não prometer favoritos, avaliações, notificações ou profissionais selecionáveis que o produto não implementa.

O assistente é um experimento opcional para aprender seleção de ferramentas de leitura e avaliações. Continua acessível pela conta, identificado como simulação, fora da navegação principal. Dados técnicos ficam sob expansão explícita. Consulta por pergunta não é necessária para agendar: a jornada principal usa catálogo → serviço → data → horário.

## Verificação

Bugs exigem RED/GREEN observado e regressões versionadas. Telas usam a exceção visual autorizada: implementação seguida de revisão em navegador e testes. Conferir 360/390 px, tablet e desktop, menu/diálogos, foco, nomes longos e rolagem horizontal; executar lint/build, suíte Playwright e jornadas reais quando ambos os projetos e banco estiverem disponíveis.

## Resultado da entrega

Implementados catálogo, área profissional, autenticação, agenda, gestão, perfil, ajuda e assistente na identidade comum. Preço de serviço agora usa texto durante a edição, aceita vírgula/ponto com até duas casas decimais e converte no envio: vazio é obrigatório, zero explícito continua permitido. Duração também preserva digitação vazia antes de validar. Criação/edição mostram sucesso/erro. Aviso de exclusão foi alinhado ao backend: não exclui o perfil do dono.

Evidências de RED/GREEN: três regressões de preço falharam com zero forçado; aviso de exclusão e retorno de falha de criação também falharam antes das respectivas correções. A implementação visual usou a exceção autorizada de testes após telas. Os testes existentes foram adaptados à navegação acessível, textos em português e ao endereço em campos separados, que já havia sido implementado em outra entrega.

Validação final: lint/build aprovados e 44 testes de interface aprovados. Os seis cenários de viewport cobrem 360, 768 e 1440 px, ausência de rolagem horizontal, navegação mobile e dimensões/rolagem de diálogo. Screenshots em `output/playwright` foram inspecionados e permanecem ignorados pelo Git. O build mantém o alerta de bundle JS maior que 500 kB; não houve alteração de dependências ou bundler nesta tarefa.

Limite: testes de responsividade foram executados no Chromium, sem comprovar comportamento em um aparelho físico ou Safari. O assistente continua sendo um simulador de consultas, sem modelo generativo. A explicação do experimento e os dados técnicos são opcionais; a navegação de agendamento não depende dele.

As duas jornadas com API/PostgreSQL reais também passaram: cadastro de loja/serviço, expediente/folga, reserva/conflito/cancelamento/remarcação/conclusão e consulta do assistente sem escrita. Foram executadas depois da suíte de interface para não disputar artefatos do Playwright.
