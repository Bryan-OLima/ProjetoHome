# Estado Atual do Projeto

**Atualizado em:** 2026-07-28  
**Fase atual:** Etapa 2 — concluída em 2026-07-28
**Estado geral:** Etapas 1 e 2 concluídas e validadas no S20 FE

## Objetivo da fase atual

Implementar logs operacionais estruturados e auditoria mínima sem registrar dados sensíveis.

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
- Etapa 1 validada no S20 FE: `npm ci`, typecheck, testes e build concluídos; frontend servido pelo Express; recuperação após encerramento forçado; acesso pela rede local; e inicialização automática pelo Termux:Boot confirmados.
- Contrato compartilhado de evento operacional criado com timestamp, nível, serviço, ação, resultado, `requestId`, `correlationId`, duração, código de erro, mensagem e contexto opcionais.
- Sanitização central implementada para remover senhas, tokens, segredos, autenticação, cookies, sessões e conteúdo privado, com limites de profundidade e tamanho.
- Armazenamento operacional implementado em JSONL rotativo, com padrão de 5 MiB por arquivo e retenção máxima de sete arquivos incluindo o ativo.
- Ciclo HTTP integrado ao logging com resultado, duração, status e correlação pelo mesmo `requestId` enviado ao cliente.
- Falhas na escrita da telemetria isoladas do fluxo principal e reportadas ao stderr sem conteúdo do evento.
- Validação local do primeiro incremento da Etapa 2 aprovada: typecheck dos três workspaces, 14 testes e build de produção, incluindo contrato, sanitização, rotação, retenção, isolamento de falha e correlação HTTP em sucesso e erro.
- Contrato compartilhado de auditoria criado com ator, ação, recurso mínimo, permissão, resultado e identificadores de rastreio.
- Migration versionada criada para tabelas separadas de auditoria e erros relevantes, com índices de tempo, ação ou serviço e correlação.
- Migrations integradas à abertura controlada do SQLite; uma falha fecha a conexão e impede inicialização com schema parcial.
- Serviço de persistência implementado com nova sanitização na fronteira do banco e escritas síncronas curtas.
- Apenas logs de nível `error` são duplicados no SQLite; eventos operacionais de maior volume permanecem somente no JSONL.
- Falha ao persistir um erro no SQLite permanece isolada do JSONL e do fluxo HTTP.
- Validação local do segundo incremento da Etapa 2 aprovada: typecheck dos três workspaces e 19 testes, cobrindo migration, auditoria sanitizada, seleção de erros relevantes e espera por contenção em WAL.
- Validação da Etapa 2 aprovada no S20 FE em 2026-07-28: testes unitários, build de produção Vite, migrations das tabelas `audit_events` e `error_events`, `PRAGMA integrity_check = ok` e correlação do `requestId` no JSONL. Evidências locais: `var/validation/stage-2-20260728T185758Z/`.
- Convenção obrigatória de commits registrada: categoria entre colchetes, mensagem curta em inglês e categoria principal única.
- README consolidado como resumo e setup da aplicação atual, incluindo logging, auditoria, migrations e variáveis de operação.
- Contratos Zod, DTOs públicos e rota tipada implementados para consulta de eventos persistidos, com body ausente declarado como `never`.
- Caso de uso `ListPersistedEvents`, portas específicas de repositório e adaptador Drizzle implementados sem DAO genérico ou dependência adicional.
- `GET /api/observability/events` implementado com filtros por tipo, período, serviço, ação e correlação, paginação por cursor e resposta sanitizada.
- Política inicial de retenção implementada na inicialização: 365 dias para auditoria, 90 dias para erros e lote máximo configurável de 500 remoções por tabela.
- Auditoria de sistema criada quando a retenção remove eventos expirados.
- Validação local aprovada: typecheck dos três workspaces e 27 testes, cobrindo contratos, rota, filtros, cursor válido e inválido, sanitização, retenção em lote e contenção.
- Validação em produção no S20 FE aprovada: atualização por Git, `npm ci`, typecheck, testes, build, migrations, supervisor e os endpoints `GET /health` e `GET /api/observability/events` responderam conforme esperado; filtro incompatível retornou `400 invalid_request` com envelope seguro.
- Contrato Zod, caso de uso e rota tipada implementados para consulta dos logs operacionais JSONL, mantendo body ausente como `never`.
- `GET /api/observability/operational-logs` implementado com filtros de período, nível, serviço, ação e correlação; retorna eventos do mais recente ao mais antigo e informa quando o resultado foi truncado.
- Adaptador JSONL separado implementado com leitura reversa em blocos, limite configurável de bytes, arquivos rotativos conhecidos e nova sanitização/validação antes da resposta.
- Validação local aprovada: typecheck dos três workspaces e 31 testes, cobrindo rota, filtros, ordem dos arquivos rotativos, teto de leitura e nova sanitização dos registros lidos.
- Validação em produção no S20 FE aprovada em 2026-07-28: `npm ci`, typecheck, 31 testes, build de produção, migrations, `PRAGMA integrity_check = ok`, correlação pelo `requestId` no JSONL e resposta válida da consulta de logs operacionais. Evidências locais: `var/validation/stage-2-20260728T201648Z/`.
- Página `/logs` implementada para consultar, em seções separadas, eventos persistidos e logs operacionais; possui filtros por período, nível, tipo, serviço, ação e correlação, além de detalhes técnicos sanitizados.
- Rota `/logs` entregue pelo Express em produção e proxy de desenvolvimento configurado para `/api`.
- Validação local da página aprovada: typecheck dos três workspaces, 35 testes e build de produção, cobrindo sucesso, filtros, vazio, indisponibilidade, erro de API e entrega da rota estática.
- Ajuda contextual acessível adicionada aos filtros técnicos de tipo persistido, serviço, ação e correlação, com as opções atuais de consulta.
- Validação final da página `/logs` no S20 FE aprovada: carregamento normal, filtros de data e nível operacional e ajuda contextual confirmados no navegador. A indisponibilidade completa do processo resulta corretamente em recusa de conexão, pois o mesmo Express entrega frontend e API; o estado de indisponibilidade da interface permanece coberto pelos testes automatizados.

## Em andamento

- Nenhum incremento de código ativo.

## Próximo passo recomendado

Planejar o primeiro incremento vertical da Etapa 3 — monitoramento do S20 FE e dashboard.

## Melhoria futura registrada

- Quando houver um catálogo confiável de serviços observados, evoluir o filtro de serviço da página `/logs` de texto livre para dropdown dinâmico. Essa melhoria não bloqueia a conclusão da Etapa 2.

## Primeira entrega de código implementada

- Backend Node.js, TypeScript e Express inicializado.
- Frontend React, TypeScript e Vite inicializado.
- npm workspaces, Drizzle e SQLite em WAL configurados.
- `GET /health` criado com status, versão, uptime, banco, timestamp e `requestId`.
- Cartão de status criado com estados de carregamento, online e offline.
- Acesso pela rede local, comportamento offline e recuperação automática foram validados no S20 FE.

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
