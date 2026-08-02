# Estado Atual do Projeto

**Atualizado em:** 2026-08-01
**Fase atual:** Etapa 5 — IA local e registro de ferramentas concluída
**Estado geral:** Etapas 1, 2, 3, 4 e 5 concluídas e validadas no S20 FE

## Objetivo da fase atual

Integrar a IA local por meio de ferramentas autorizadas, mantendo o backend como fronteira de permissão e execução.

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
- Primeiro incremento da Etapa 3 implementado: contrato Zod e `GET /api/monitoring/metrics` para coleta sob demanda de uptime, memória, swap, armazenamento e temperaturas disponíveis do aparelho.
- O coletor isola falhas por fonte e representa cada métrica numérica como disponível ou indisponível, preservando a resposta parcial.
- Dashboard raiz ampliado com cartões de uptime, memória disponível, swap usada, armazenamento disponível, temperatura da CPU e temperatura da bateria, além de estados explícitos de carregamento, indisponibilidade e falha.
- Validação local da Etapa 3 aprovada: typecheck dos três workspaces, 40 testes e build de produção.
- Validação do primeiro incremento da Etapa 3 aprovada no S20 FE: `GET /api/monitoring/metrics` retornou métricas válidas pelo SSH e os cartões do dashboard foram conferidos no navegador pela rede local com host modificado.
- Atividade recente implementada no dashboard com até cinco eventos operacionais, estados de carregamento, vazio, indisponibilidade e erro, sem polling ou nova persistência.
- Validação local da atividade recente aprovada: typecheck dos três workspaces, 43 testes e build de produção.
- Alertas básicos implementados no painel de monitoramento, sem nova coleta: memória disponível abaixo de 15%, swap usada acima de 75%, armazenamento disponível abaixo de 10% e temperaturas de CPU ou bateria a partir de 45 °C.
- Validação local conjunta de atividade recente e alertas aprovada: typecheck dos três workspaces, 44 testes e build de produção.
- Validação final da Etapa 3 aprovada no S20 FE em 2026-08-01: atividade recente exibida corretamente no dashboard e estado normal dos alertas básicos confirmado, sem degradação observada da interface ou do servidor.
- Etapa 3 concluída: dashboard disponibiliza status, métricas sob demanda, atividade recente e alertas básicos; a coleta possui logging HTTP correlacionado e as fontes indisponíveis continuam isoladas na resposta.
- Primeiro incremento da Etapa 4 implementado: raiz interna autorizada configurável por `STORAGE_ROOT` (padrão `./data/storage`), criada pelo backend quando necessário e sem caminho recebido do navegador.
- `GET /api/storage/locations` expõe somente capacidade total, usada e disponível dessa raiz; resposta parcial segura indica indisponibilidade da raiz sem falhar a API.
- Dashboard ampliado com cartão de armazenamento interno e estados de carregamento, indisponibilidade e erro.
- Validação local da Etapa 4 aprovada: typecheck dos três workspaces, 47 testes e build de produção.
- Validação do primeiro incremento da Etapa 4 aprovada no S20 FE: `GET /api/storage/locations` e o cartão de armazenamento interno responderam normalmente.
- Inventário seguro da raiz interna implementado em `GET /api/storage/internal/items`: máximo de 100 itens por consulta, raiz fixa, sem recursão, sem leitura de conteúdo e sem seguir links simbólicos.
- Validação local do inventário aprovada: typecheck dos três workspaces, 48 testes e build de produção, incluindo rejeição de parâmetro de caminho arbitrário.
- Validação final da Etapa 4 aprovada no S20 FE em 2026-08-01: inventário da raiz interna exibido normalmente pelo endpoint e pelo dashboard.
- Etapa 4 concluída: armazenamento interno possui capacidade e inventário seguro; não há microSD instalado no aparelho atual.
- Registro interno de ferramentas da IA implementado com allowlist, schema Zod de entrada e saída, permissão declarada, timeout e logging correlacionado.
- Primeira ferramenta de leitura definida: `system.get_metrics`, com permissão `monitoring.read`, argumentos vazios estritos, timeout de 1,5 segundo e acesso apenas ao coletor de métricas já autorizado.
- O registro rejeita ferramentas inexistentes e argumentos inválidos antes de qualquer handler; também valida a saída, limita a execução e registra metadados sem conteúdo sensível.
- Validação local do primeiro incremento técnico da Etapa 5 aprovada: typecheck dos três workspaces, 52 testes e build de produção.
- Contrato substituível `LocalAIService` implementado para o endpoint de chat completion do `llama.cpp`, aceitando exclusivamente `http://127.0.0.1`.
- O serviço limita mensagens, caracteres de entrada, tokens de saída, bytes da resposta e tempo de execução; runtime indisponível, timeout e resposta inválida falham de modo isolado.
- Configurações do runtime local registradas em ambiente, com perfil padrão Qwen3-1.7B Q4_K_M, timeout de 60 segundos, 8.192 caracteres de entrada e 128 tokens de saída.
- Validação local do segundo incremento técnico da Etapa 5 aprovada: typecheck dos três workspaces, 58 testes e build de produção.
- Primeira consulta ponta a ponta implementada: `POST /api/assistant/query` valida a pergunta, cria `correlationId`, pede ao modelo uma decisão JSON estrita e chama exclusivamente `system.get_metrics` quando autorizado.
- Dashboard ampliado com o painel Assistente local, entrada em linguagem natural, resposta textual, dados JSON consultados e estado seguro de indisponibilidade.
- Perguntas, prompts, argumentos e respostas da IA não seguem para os logs; são registrados apenas metadados correlacionados de consulta e ferramenta.
- Validação local da consulta ponta a ponta aprovada: typecheck dos três workspaces, 68 testes e build de produção. A validação real com `llama.cpp` e S20 FE permanece pendente.
- Assistente ampliado com resposta natural fundamentada em contexto factual curto: identidade do Projeto Home, capacidades atuais, limites e ferramentas disponíveis.
- Consultas textuais não recebem dados atuais, logs, banco ou arquivos.
- Perguntas explícitas de memória, temperatura, CPU, bateria, swap, armazenamento, espaço ou uptime possuem caminho seguro para `system.get_metrics` sem depender do modelo.
- Prompt e textos do painel normalizados em português e UTF-8.
- Validação local da manutenção do assistente aprovada: typecheck dos três workspaces, 70 testes e build de produção. A validação real com `llama.cpp` e S20 FE permanece pendente.
- Consultas explícitas de métricas agora chamam `system.get_metrics` antes da classificação do modelo, eliminando a dependência de uma primeira resposta válida para dados atuais do servidor.
- Ferramenta local `math.evaluate` implementada com expressão limitada a 128 caracteres, parser aritmético próprio, permissão declarada, timeout de 100 ms e sem acesso a `eval`, shell, rede, arquivos ou banco.
- Consultas gerais permanecem flexíveis em linguagem natural, porém recebem apenas contexto factual curto do Projeto Home; métricas e cálculos recebem somente seus resultados sanitizados e estruturados.
- Validação local da ampliação de flexibilidade aprovada: typecheck dos três workspaces e 75 testes. A validação real com `llama.cpp` e S20 FE permanece pendente.
- Respostas de `system.get_metrics` e `math.evaluate` passaram a ser formatadas deterministicamente pelo backend, impedindo que o modelo converta bytes, temperaturas ou resultados matemáticos de modo incorreto.
- Dados estruturados das ferramentas não são enviados pela resposta pública do assistente; inspeção detalhada de métricas permanece no dashboard e em `GET /api/monitoring/metrics`.
- Validação local da apresentação determinística aprovada: typecheck dos três workspaces e 78 testes. A validação real com `llama.cpp` e S20 FE permanece pendente.
- A classificação JSON intermediária foi removida das perguntas gerais, que agora seguem diretamente para uma resposta natural do modelo sob contexto factual curto e sem novas permissões.
- Confirmação de disponibilidade da API e a ausência atual de uma média de duração de requisições têm respostas locais explícitas, sem depender do runtime de IA.
- Validação local da ampliação da conversa aprovada: typecheck dos três workspaces e 79 testes. A validação real com `llama.cpp` e S20 FE permanece pendente.
- A resposta pública do assistente foi reduzida a mensagem e identificadores de rastreio, sem nome da ferramenta ou resultado estruturado; o backend continua validando e usando esses resultados internamente.
- Página `/documentation` implementada com referência das rotas públicas de health, monitoramento, storage, observabilidade e assistente, além das páginas atuais da interface; o Express entrega a rota estática em produção.
- Validação local da página de documentação aprovada: typecheck dos três workspaces e 81 testes. A validação no S20 FE permanece pendente.
- Validação final da Etapa 5 aprovada no S20 FE em 2026-08-01: runtime `llama.cpp` em loopback, métricas e cálculos determinísticos, confirmação de disponibilidade da API, explicação da indisponibilidade da média de duração de requisições, conversa geral e ausência de dados internos na resposta do assistente foram conferidos no navegador. Logs correlacionados de consulta e ferramenta foram confirmados em `/logs`.
- Etapa 5 concluída: o assistente local responde consultas gerais sem permissões adicionais, usa somente caminhos autorizados para dados do sistema e mantém resultados internos de ferramentas fora da resposta pública.

## Em andamento

Nenhum trabalho em andamento.

## Próximo passo recomendado

Planejar o primeiro incremento vertical da Etapa 6 — Gmail somente leitura, sem iniciar a implementação antes da definição explícita do escopo.

## Melhoria futura registrada

- Quando houver um catálogo confiável de serviços observados, evoluir o filtro de serviço da página `/logs` de texto livre para dropdown dinâmico. Essa melhoria não bloqueia a conclusão da Etapa 2.
- Dados detalhados de bateria — percentual, estado de carga, saúde e corrente — ficam para futura implementação após decisão explícita de instalar e configurar o complemento Termux:API. A ausência desse complemento não bloqueia a temperatura térmica já exposta pelo Android nem as demais métricas.
- Suporte a microSD fica para implementação futura: o S20 FE atual não possui cartão instalado. Quando houver um, definir explicitamente sua raiz autorizada, validar montagem, capacidade e inventário antes de expô-lo pela API.

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
