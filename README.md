# React + TypeScript + Vite

> **PS — mudança de foco em 17/10/2026:** este front fazia parte de um projeto
> de estudo de barbearias que ficou incompleto. A partir deste ponto, ele passa
> a servir também como laboratório para estudar IA, skills, agentes e Git
> worktrees, junto com a Barber Shop API. A documentação original foi
> preservada abaixo. Veja o [ambiente e estado atual](./docs/estado-atual.md)
> para executar com pnpm e conhecer as limitações reais.

O [CI do frontend](./docs/ci-frontend.md) automatiza lint, build e testes de interface com API controlada em pull requests e pushes na `main`. A integração com API/PostgreSQL reais tem [procedimento próprio](./tests/integration/README.md). Para entender branches, PRs, `gh` e as automações, leia o [fluxo Git/GitHub/Actions](./docs/fluxo-git-github-actions.md).

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Políticas de agendamento

A jornada de reservas aplica antecedência de 30 minutos a 60 dias, grade local de 30 minutos e cancelamento pelo cliente até 24 horas antes. Folgas/expediente preservam reservas existentes. O assistente experimental foi removido: não há mais tela, navegação ou integração com `/api/v1/assistant/chat`. O endereço antigo `/assistant` segue o tratamento existente de página inexistente. Catálogo, serviços e agendamento permanecem disponíveis pelas telas próprias.

## Histórico — políticas e assistente de consultas

> Registro da entrega anterior, preservado como evidência histórica. O assistente e seus testes exclusivos foram removidos posteriormente; os resultados abaixo não descrevem a suíte atual.

O laboratório incluía `/assistant`, autenticado e identificado como **Modo simulado**, para consultar catálogo, serviços e horários por ferramentas reais. Não havia modelo generativo nem operações de escrita no assistente. Os contratos, limites e relatório histórico ficam em `../Projeto_Barber_API/docs/assistant/simulador.md` e `../Projeto_Barber_API/docs/entrega-politicas-assistente.md` no workspace com ambos os projetos.

Validação desta entrega no checkout integrado: lint/build, **32 cenários de interface** e **2 jornadas com API/PostgreSQL reais** aprovados. A revisão independente encontrou e corrigiu contexto antigo ao paginar lojas no assistente; regressões permanentes cobrem paginação, perguntas apenas com espaços e prazo de cancelamento. A tela usou a exceção de testes após implementação visual; as correções de bugs observaram RED/GREEN.
