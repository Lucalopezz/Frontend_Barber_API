# Pendências de interface e experiência

> Histórico de feedback e da repaginação. O assistente experimental mencionado abaixo foi removido posteriormente, incluindo tela e navegação. As recomendações específicas do simulador deixaram de se aplicar.

## P1 — revisar clareza e qualidade visual da aplicação

Feedback do usuário registrado em 18/10/2026:

> A interface da aplicação está péssima e confusa, está parecendo muito IA, com textos que não ajudam o usuário final, apenas confundem ele.

Estado: identificado, ainda não implementado. Revisar a aplicação como um todo; não limitar o problema à tela do assistente.

Direção sugerida para a próxima entrega:

- Revisar navegação e hierarquia das ações para cliente e dono/profissional.
- Trocar textos genéricos, redundantes ou técnicos por instruções curtas relacionadas à tarefa atual.
- Mostrar detalhes do laboratório, ferramentas e payloads apenas quando houver utilidade explícita; na interface principal priorizar o que ajuda a consultar, agendar e gerenciar.
- Manter a identificação honesta do simulador, com linguagem simples e discreta.
- Unificar espaçamento, tipografia, componentes e estados de carregamento, vazio e erro; conferir telas pequenas.
- Validar uma jornada por vez com revisão visual e testes de comportamento, respeitando a exceção de TDD para telas documentada no AGENTS.md.

Critérios sugeridos de aceite: ação principal evidente em cada tela, contexto selecionado visível, ausência de explicações técnicas sem utilidade para o usuário e conclusão das jornadas de consulta/agendamento/gestão sem depender de explicação externa.

Este registro não autoriza uma reformulação visual imediata; o próximo escopo deve ser definido antes da implementação.

## PS — primeira repaginação implementada

A nova identidade, navegação mobile, revisão de textos, formulários de preço e posição experimental do assistente foram implementadas nesta entrega. Direção, limites e evidências estão em `docs/interface.md`. Validação: lint/build, 44 testes de interface e duas jornadas com API/PostgreSQL reais aprovados; revisão visual em desktop e telas pequenas. Este feedback original fica preservado para orientar novas avaliações de uso.
