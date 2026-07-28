# Estado Atual do Projeto

**Atualizado em:** 2026-07-28  
**Fase atual:** Etapa 1 — Preparar ambiente e esqueleto  
**Estado geral:** fundação concluída e instruções operacionais definidas; aplicação principal ainda não iniciada

## Objetivo da fase atual

Definir somente as escolhas necessárias ao esqueleto e iniciar a primeira entrega vertical da aplicação sem reabrir decisões já validadas.

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

## Em andamento

- Confirmação das decisões ainda necessárias ao esqueleto: estrutura do repositório, build do frontend e validação de esquemas.

## Próximo passo recomendado

Escolher a estrutura do repositório, a ferramenta de build do frontend e a biblioteca de validação de esquemas. Em seguida, iniciar a primeira entrega vertical da **Etapa 1 — Preparar ambiente e esqueleto**, descrita em `IMPLEMENTATION_MAP.md`.

## Primeira entrega de código planejada

- Inicializar backend Node.js, TypeScript e Express.
- Inicializar frontend React e TypeScript.
- Configurar npm, Drizzle e SQLite em WAL.
- Criar `GET /health` com status, versão, uptime e `requestId`.
- Criar cartão de status no frontend.
- Validar acesso pela rede local e comportamento offline.

## Decisões pendentes antes ou durante a Etapa 1

| Decisão | Estado | Observação |
|---|---|---|
| Estrutura do repositório | Pendente | Avaliar monorepo com frontend e backend. |
| Build do frontend | Pendente | Vite é uma possibilidade, ainda não uma decisão. |
| Validação de esquemas | Pendente | Necessária para API, ferramentas e WebSocket. |
| Armazenamento dos logs | Pendente | Separar arquivos operacionais de auditoria consultável. |
| Autenticação da dashboard | Pendente | Necessária antes de dados sensíveis. |
| Processo em segundo plano | Pendente | Investigar comportamento do Android/Termux. |

## Bloqueios atuais

Nenhum bloqueio técnico conhecido. A implementação depende apenas das três escolhas diretamente necessárias ao esqueleto, registradas acima.

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
