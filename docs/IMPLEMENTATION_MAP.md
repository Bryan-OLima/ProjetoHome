# Mapa de Implementação

## Objetivo

Este documento define a ordem operacional de construção. Cada etapa deve resultar em um incremento utilizável, testado e observável. Não iniciar uma etapa futura enquanto os critérios obrigatórios da etapa atual não forem atendidos, salvo decisão registrada.

## Definição de pronto para qualquer etapa

- Código executa no ambiente de destino ou em ambiente local equivalente.
- Entradas são validadas e erros têm resposta padronizada.
- Fluxos relevantes possuem logs sem dados sensíveis.
- Ações sensíveis geram auditoria.
- Há testes proporcionais ao risco da mudança.
- Frontend trata carregamento, sucesso, vazio, indisponibilidade e erro quando aplicável.
- Documentação afetada foi atualizada.
- `CURRENT_STATE.md` registra o resultado e o próximo passo.

## Etapa 0 — Fundação documental

**Estado:** concluída em 2026-07-28.

### Entregas

- Manter os seis documentos da pasta `docs/` consistentes.
- Registrar decisões técnicas ainda abertas.
- Criar posteriormente um `AGENTS.md` com instruções operacionais do repositório.

### Pronto quando

- Visão, roadmap, regras, arquitetura e estado não se contradizem.
- A primeira etapa de código pode começar sem depender de decisões implícitas.

### Evidências de conclusão

- Os seis documentos foram revisados e alinhados.
- A persistência com Drizzle e `node:sqlite` foi validada no S20 FE com cinco testes aprovados.
- O Qwen3-1.7B Q4_K_M foi validado no S20 FE por benchmark e API local.

## Etapa 1 — Preparar ambiente e esqueleto

### Ferramentas definidas

- npm como gerenciador de pacotes.
- Vitest como runner de testes.
- Supertest para testes HTTP.
- React Testing Library para testes de interface.

### Backend

- Inicializar Node.js com TypeScript e Express.
- Criar configuração por ambiente e validação das variáveis.
- Criar `GET /health` com status, versão e uptime.
- Implementar `requestId` e tratamento global de erros.
- Configurar SQLite por meio do Drizzle ORM e do driver nativo `node:sqlite`.
- Iniciar com `drizzle-orm@1.0.0-rc.4` e `drizzle-kit@1.0.0-rc.4`, versões validadas na prova; qualquer atualização deve repetir os testes de migration, concorrência e recuperação.
- Ativar `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000` e `synchronous=NORMAL`.
- Manter uma única camada do backend responsável pelo acesso ao arquivo do banco.

### Frontend

- Inicializar React com TypeScript.
- Criar estrutura de layout e cliente HTTP.
- Criar cartão de status do servidor consumindo `GET /health`.

### Ambiente

- Documentar instalação e execução no Termux.
- Confirmar acesso pela rede local a partir de outro dispositivo.
- Definir processo de inicialização e reinício.

### Testes

- Testar resposta válida do health check.
- Testar estado offline no frontend.
- Reiniciar o backend e confirmar recuperação.
- Disparar leituras simultâneas durante uma escrita curta.
- Simular escritas concorrentes e confirmar espera sem perda de dados.

### Pronto quando

- A dashboard mostra corretamente online e offline em outro dispositivo.
- Cada requisição possui identificador rastreável.

## Etapa 2 — Logging service e auditoria mínima

### Backend

- Definir evento de log estruturado.
- Implementar níveis, serviço, ação, resultado, duração e `requestId`.
- Criar sanitização central de dados proibidos.
- Separar log operacional de evento de auditoria.
- Definir armazenamento, rotação e retenção iniciais.
- Manter logs operacionais de alto volume em arquivos estruturados com rotação.
- Persistir no SQLite apenas auditoria, erros importantes e histórico consultável.

### Frontend

- Criar página `/logs`.
- Adicionar filtros por período, nível, serviço, ação e correlação.
- Exibir detalhes técnicos sanitizados.

### Testes

- Confirmar correlação entre requisição e eventos gerados.
- Inserir dados simulados sensíveis e verificar remoção.
- Simular erro e confirmar apresentação no frontend.

### Pronto quando

- Uma falha pode ser rastreada da requisição ao evento final.
- Tokens, senhas, cookies e conteúdo privado não aparecem nos registros.

## Etapa 3 — Monitoramento do S20 FE e dashboard

### Backend

- Coletar uptime, memória, armazenamento, bateria e temperatura quando disponíveis.
- Expor endpoint tipado de métricas.
- Detectar métricas indisponíveis sem falhar a resposta inteira.

### Frontend

- Criar dashboard com status e métricas principais.
- Exibir atividade recente e alertas básicos.
- Criar visões de carregamento, indisponibilidade e erro.

### Pronto quando

- O usuário identifica rapidamente a saúde do servidor.
- A coleta de métricas possui logs e não degrada o serviço.

## Etapa 4 — Storage service

### Entregas

- Definir raízes de armazenamento autorizadas.
- Expor capacidade, uso e disponibilidade.
- Criar inventário seguro sem permitir caminhos arbitrários.
- Preparar abstração para armazenamento interno e microSD.

### Pronto quando

- Caminhos fora das raízes autorizadas são rejeitados.
- A dashboard mostra capacidade e falhas de montagem.

## Etapa 5 — IA local e registro de ferramentas

### Backend

- Integrar `llama.cpp` como runtime local.
- Configurar Qwen3-1.7B Q4_K_M como perfil padrão: backend de CPU, quatro threads e contexto inicial de 4096 tokens.
- Medir o Qwen3-4B Q4 apenas como perfil experimental, sem torná-lo requisito.
- Criar `LocalAIService` com contrato substituível.
- Criar registro de ferramentas com nome, esquema, permissão e handler.
- Implementar fluxo: pedido, interpretação, validação, ferramenta, resultado e resposta.
- Limitar tempo, tamanho de entrada e tamanho de saída.
- Carregar o modelo sob demanda e liberar recursos conforme a estratégia definida para o Android.

### Frontend

- Criar interface de consulta.
- Permitir apresentação em texto e JSON.
- Exibir erros claros sem vazar detalhes internos.

### Testes

- Tentar invocar ferramenta inexistente.
- Enviar argumentos inválidos.
- Simular timeout e indisponibilidade do modelo.
- Confirmar que o modelo não acessa diretamente banco, arquivos ou shell.

### Pronto quando

- Uma ferramenta de leitura simples funciona ponta a ponta.
- Toda chamada de ferramenta é validada, correlacionada e auditável.

## Etapa 6 — Gmail somente leitura

### Entregas

- Configurar OAuth e proteção dos tokens.
- Criar ferramentas `gmail.search` e `gmail.getMessage` com limites.
- Reduzir o conteúdo ao mínimo necessário antes de enviá-lo ao modelo.
- Produzir resumo em texto ou JSON.
- Exibir origem e período consultado.

### Testes

- Revogar autorização e confirmar falha segura.
- Consultar tema sem resultados.
- Consultar volume acima do limite.
- Confirmar ausência de token e corpo completo nos logs.

### Pronto quando

- Uma consulta explícita retorna resumo rastreável.
- Nenhuma operação de escrita no Gmail está disponível.

## Etapa 7 — PC Agent e WebSocket

### Agente do PC

- Criar processo separado com identidade própria.
- Conectar ao servidor por WebSocket autenticado.
- Implementar heartbeat, reconexão e versão de protocolo.
- Expor apenas capacidades registradas.

### Servidor e frontend

- Manter estado de presença e última atividade.
- Mostrar conexão e métricas autorizadas do PC.
- Auditar comandos e resultados.

### Testes

- Perder e restabelecer conexão.
- Usar credencial inválida.
- Solicitar capacidade não permitida.
- Simular versões de protocolo incompatíveis.

### Pronto quando

- O servidor consulta uma informação autorizada do PC.
- Não existe endpoint ou ferramenta de shell arbitrário.

## Etapa 8 — Steam e Sunshine

### Steam

- Descobrir jogos instalados por capacidade específica do PC Agent.
- Expor dados necessários à dashboard.

### Sunshine

- Consultar estado e disponibilidade do serviço.
- Exibir diagnóstico autorizado.

### Pronto quando

- As duas integrações falham isoladamente sem desconectar o agente ou derrubar o core.

## Etapa 9 — Impressora 3D

### Entregas

- Definir adaptador para a interface disponível da impressora.
- Coletar estado, progresso e falhas.
- Exibir trabalho atual e histórico.
- Gerar eventos e alertas locais.

### Pronto quando

- Estado e progresso aparecem de forma confiável.
- Falhas da impressora não afetam outras integrações.

## Etapa 10 — Resiliência e expansão

Implementar apenas quando os fluxos anteriores estiverem estáveis:

1. Event bus tipado.
2. Backups e restauração testada.
3. Uso e monitoramento do microSD.
4. Acesso remoto seguro.
5. Base de conhecimento pessoal.

Cada item deve receber uma especificação própria antes da implementação.

## Estratégia de concorrência e webhooks

- Webhooks acessam somente a API; nenhum cliente externo abre o arquivo SQLite.
- O endpoint valida e registra rapidamente o evento, respondendo `202` quando houver processamento assíncrono.
- Uma fila interna processa Gmail, IA, PC Agent e outras operações demoradas.
- Nenhuma transação permanece aberta durante chamadas externas ou inferência.
- Escritas são curtas, indexadas e serializadas pelo SQLite.
- O arquivo ativo permanece no armazenamento interno do Termux, nunca em microSD ou filesystem de rede.
- PostgreSQL só será reconsiderado se houver múltiplos processos escritores, contenção persistente ou necessidade de banco remoto.

## Baselines validados no S20 FE

- Persistência: migration aplicada, cinco testes aprovados, 50 webhooks simultâneos sem perda, 100 escritas em quatro conexões sem perda e recuperação íntegra após interrupção.
- IA local: Qwen3-1.7B Q4_K_M com `17,46 tokens/s` de processamento e `11,52 tokens/s` de geração no benchmark.
- API da IA: `16,18 tokens/s` de processamento, `9,89 tokens/s` de geração, pico de RSS de `1.769.068 kB` e resposta coerente em português.

## Registro de decisões pendentes

As seguintes escolhas ainda não foram fechadas e não devem ser presumidas:

- ferramenta de build do frontend;
- formato físico de armazenamento de logs;
- estratégia de autenticação dos usuários da dashboard;
- protocolo específico da impressora 3D;
- solução de VPN para acesso remoto.
