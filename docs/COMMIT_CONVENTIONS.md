# Convenções de Commit

## Formato obrigatório

Todo commit deve seguir este formato:

```text
[CATEGORY] Short imperative description
```

- A categoria entre colchetes é obrigatória e deve ser uma das categorias definidas abaixo.
- A descrição é obrigatoriamente em inglês, direta e curta.
- Use verbo no imperativo e descreva a mudança, não a intenção vaga. Prefira `Add audit event queries` a `Updates`.
- Escolha uma única categoria principal. Separe mudanças independentes em commits diferentes quando isso tornar o histórico mais claro.

## Categorias permitidas

| Categoria | Quando usar | Exemplo |
|---|---|---|
| `[NEW FEATURE]` | Nova capacidade de produto ou API. | `[NEW FEATURE] Add audit event filters` |
| `[BUG FIX]` | Correção de comportamento incorreto. | `[BUG FIX] Preserve request correlation on errors` |
| `[REFACTORING]` | Melhoria interna sem alterar comportamento esperado. | `[REFACTORING] Extract SQLite event repository` |
| `[DELETED]` | Remoção intencional de código, arquivo ou capacidade. | `[DELETED] Remove obsolete health mock` |
| `[POC]` | Prova de conceito isolada ou evidência experimental. | `[POC] Validate SQLite recovery on Termux` |
| `[TESTS]` | Alteração exclusiva ou predominante de testes. | `[TESTS] Cover JSONL rotation limits` |
| `[CONFIGURATION]` | Configuração de ambiente, build, ferramenta ou operação. | `[CONFIGURATION] Add log retention settings` |
| `[DOCUMENTATION]` | Documentação sem mudança funcional de código. | `[DOCUMENTATION] Record Stage 2 device validation` |
| `[SECURITY]` | Correção ou reforço de segurança e privacidade. | `[SECURITY] Redact authorization headers` |
| `[DEPENDENCIES]` | Adição, remoção ou atualização de dependências. | `[DEPENDENCIES] Update Drizzle migration tooling` |
| `[PERFORMANCE]` | Mudança focada em tempo, memória ou consumo de recursos. | `[PERFORMANCE] Avoid persisting non-error events` |
| `[CI]` | Automação de integração, validação ou entrega contínua. | `[CI] Run typecheck before tests` |

## Exemplos inválidos

```text
add logs
[NEW FEATURE] adicionar logs
[NEW FEATURE] Implements a very large set of changes across the full application
```

## Exemplos válidos

```text
[NEW FEATURE] Add persistent audit events
[TESTS] Cover WAL write contention
[DOCUMENTATION] Record Stage 2 device validation
```
