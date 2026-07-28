# Estado Atual do Projeto

**Atualizado em:** 2026-07-28  
**Fase atual:** Etapa 1 — Preparar ambiente e esqueleto  
**Estado geral:** primeira entrega vertical e operação local implementadas e validadas; validação no S20 FE pendente

## Objetivo da fase atual

Validar no ambiente-alvo a primeira entrega vertical já implementada, sem ampliar o escopo da Etapa 1.

## Concluído

- Visão do produto documentada.
- Roadmap organizado em MVPs e evoluções posteriores.
- Mapa de implementação criado com ordem e critérios de pronto.
- Regras técnicas, de segurança e privacidade registradas.
- Arquitetura lógica inicial documentada.
- Limites da IA e do PC Agent definidos.
- Logs e auditoria classificados como parte obrigatória do núcleo.
- Gmail definido como integração sob demanda e somente leitura na primeira versão.
- Samsung S20 FE com Termux confirmado como servidor principal.
- Variante de 6 GB confirmada por `MemTotal: 5.763.296 kB`.
- npm definido como gerenciador de pacotes.
- SQLite, Drizzle ORM e o driver nativo `node:sqlite` aprovados para persistência.
- `drizzle-orm@1.0.0-rc.4` e `drizzle-kit@1.0.0-rc.4` registradas como versões da prova aprovada.
- WAL, transações curtas e fila interna definidos como estratégia de concorrência.
- Vitest, Supertest e React Testing Library definidos para testes.
- `llama.cpp` definido como runtime local.
- Qwen3-1.7B Q4_K_M aprovado como modelo padrão, em CPU, com quatro threads e contexto inicial de 4096 tokens.
- Qwen3-4B Q4 definido apenas como perfil experimental condicionado a benchmark.
- Prova de persistência aprovada no S20 FE: migration aplicada, cinco testes aprovados, 50 webhooks simultâneos e 100 escritas em quatro conexões sem perdas, além de recuperação íntegra após interrupção.
- Prova da IA aprovada no S20 FE: `9,89 tokens/s` pela API, pico de RSS de `1.769.068 kB`, resposta coerente em português e temperatura máxima de `39,0 °C` no ensaio completo.
- Artefatos das provas mantidos em `experiments/sqlite-driver/` e `experiments/qwen-runtime/`.
- `AGENTS.md` criado na raiz com ordem de leitura, fluxo de trabalho, restrições e critérios de validação.
- `README.md` criado na raiz como porta de entrada, com resumo do projeto, stack, configuração, provas e navegação documental.
- Repositório Git inicializado na branch `main` e `.gitignore` raiz configurado para preservar fontes reproduzíveis sem versionar dependências, segredos, bancos, modelos ou artefatos locais.
- Monorepo com npm workspaces aprovado: `packages/contracts`, `apps/server` e `apps/web`.
- Vite com `@vitejs/plugin-react` aprovado para o frontend.
- Zod 4 aprovado para validação e contratos compartilhados; schemas Drizzle permanecem exclusivos do backend.
- Workspaces principais criados com lockfile único: `packages/contracts`, `apps/server` e `apps/web`.
- Contratos Zod de health e erro implementados e compartilhados entre servidor e frontend.
- Backend Express implementado com configuração validada, `requestId`, envelope seguro de erro, `GET /health` e SQLite/Drizzle com os pragmas aprovados.
- Frontend React/Vite implementado com cartão de estado para carregamento, servidor online e indisponibilidade.
- Validação local aprovada: typecheck dos três workspaces, oito testes, build de produção e smoke test HTTP do servidor compilado.
- Árvore npm auditada sem vulnerabilidades conhecidas e sem conflitos de dependência.
- Build React servido pelo Express na mesma porta da API; Vite fica restrito ao desenvolvimento.
- Scripts de supervisor, parada segura e Termux:Boot criados para a operação no aparelho.
- Estratégia de logs aprovada: JSONL rotativo para operação e SQLite para auditoria, erros relevantes e histórico consultável.
- Estratégia de autenticação aprovada: conta administradora local, Argon2id, sessões revogáveis e HTTPS antes de dados sensíveis.

## Em andamento

- Repetição de `npm ci`, typecheck, oito testes e build no S20 FE.
- Validação do acesso pela rede local, dos estados online e offline da dashboard e do frontend servido pelo Express.
- Validação do Termux:Boot, supervisor, wake-lock e recuperação após queda.

## Próximo passo recomendado

Transferir ou atualizar o repositório no S20 FE, executar a validação completa do monorepo e testar a dashboard a partir de outro dispositivo da rede.

## Primeira entrega de código implementada

- Backend Node.js, TypeScript e Express inicializado.
- Frontend React, TypeScript e Vite inicializado.
- npm workspaces, Drizzle e SQLite em WAL configurados.
- `GET /health` criado com status, versão, uptime, banco, timestamp e `requestId`.
- Cartão de status criado com estados de carregamento, online e offline.
- Acesso pela rede local, comportamento offline e recuperação automática ainda dependem do ensaio no aparelho.

## Decisões registradas para a Etapa 1

| Decisão | Estado | Observação |
|---|---|---|
| Armazenamento dos logs | Definido | JSONL rotativo para operação; SQLite para auditoria e histórico consultável. |
| Autenticação da dashboard | Definida | Conta local, Argon2id, sessões revogáveis e HTTPS antes de dados sensíveis. |
| Processo em segundo plano | Definido | Termux:Boot e supervisor em shell, com Vite restrito ao desenvolvimento. |

## Bloqueios atuais

Nenhum bloqueio técnico conhecido.

## Não iniciar ainda

- Gmail.
- IA local.
- PC Agent.
- Steam.
- Sunshine.
- Impressora 3D.
- Event bus.
- Acesso remoto.
- Base de conhecimento.

Esses itens permanecem no roadmap, mas dependem do núcleo observável.

## Como atualizar este arquivo

Ao concluir uma entrega:

1. Atualizar a data e o estado geral.
2. Mover itens de "Em andamento" para "Concluído".
3. Registrar testes e validações realmente executados.
4. Atualizar decisões pendentes.
5. Definir exatamente um próximo passo recomendado.
6. Manter explícito o que não deve ser iniciado.
