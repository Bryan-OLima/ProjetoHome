# Roadmap do Produto

## Como ler este documento

Este roadmap descreve o que o produto deve oferecer e como sua capacidade evolui. A ordem técnica detalhada, os testes e as definições de pronto ficam no [Mapa de implementação](./IMPLEMENTATION_MAP.md).

As entregas devem ser verticais: sempre que possível, cada incremento inclui backend, frontend, observabilidade e validação, evitando construir toda a infraestrutura antes de apresentar algo utilizável.

## MVP 1 — Núcleo observável

Objetivo: colocar o servidor no ar e torná-lo observável antes de adicionar integrações sensíveis.

### Fundação no S20 FE

- Preparar Termux, Node.js, Git e acesso ao armazenamento.
- Usar npm como gerenciador de pacotes.
- Criar backend em Node.js e TypeScript.
- Criar frontend em React com Vite e `@vitejs/plugin-react`.
- Organizar servidor, frontend e contratos Zod em npm workspaces.
- Configurar SQLite com o driver `node:sqlite`, Drizzle ORM, WAL, chaves estrangeiras e espera controlada por locks.
- Executar frontend e backend na rede local.
- Definir inicialização, reinício e recuperação após falhas.

### Core da aplicação

- Endpoint de health check.
- Identificador de requisição e correlação.
- Tratamento padronizado de erros.
- Configuração por ambiente.
- Validação de entrada e respostas consistentes.
- Fila interna para webhooks e tarefas demoradas.
- Um único processo de backend como proprietário do arquivo SQLite.

### Logs e auditoria

- Logging service estruturado no backend.
- Níveis, categorias, origem e contexto de cada evento.
- Sanitização de dados privados.
- Correlação entre requisições, ferramentas e integrações.
- Rotação e retenção de logs.
- Auditoria separada para ações sensíveis.
- Página de logs no frontend com filtros e detalhes.
- Visões por serviço e fluxo operacional.

### Monitoramento e dashboard

- CPU, memória, bateria, temperatura, uptime e armazenamento do S20 FE.
- Estado da API, banco, IA e integrações.
- Dashboard principal com status, alertas e atividade recente.
- Estados claros de carregamento, indisponibilidade e erro.

### Storage

- Inventário seguro de arquivos autorizados.
- Informações de uso, capacidade e disponibilidade.
- Preparação para armazenamento interno e microSD.

## MVP 2 — Assistente local

Objetivo: permitir consultas em linguagem natural sem conceder acesso direto da IA aos recursos do sistema.

- Executar o Qwen3-1.7B Q4_K_M pelo `llama.cpp` como modelo padrão, inicialmente em CPU, com quatro threads e contexto de 4096 tokens.
- Avaliar o Qwen3-4B Q4 somente como perfil experimental e sob demanda.
- Criar serviço de IA desacoplado do restante da aplicação.
- Criar registro explícito de ferramentas permitidas.
- Validar argumentos e permissões no backend.
- Permitir respostas em texto ou JSON.
- Registrar consulta, ferramentas utilizadas, duração e resultado técnico.
- Impedir acesso direto do modelo ao banco, arquivos, credenciais ou shell.
- Exibir histórico e estado das consultas no frontend sem armazenar conteúdo sensível desnecessário.
- Manter o sistema funcional quando nenhum modelo estiver carregado.

## MVP 3 — Gmail sob demanda

Objetivo: consultar e resumir e-mails somente quando solicitado.

- Autenticação OAuth com escopos mínimos.
- Pesquisa por tema, remetente, período e outros filtros autorizados.
- Obtenção controlada de mensagens necessárias para a consulta.
- Resumo local e resposta estruturada.
- Redução e sanitização do conteúdo entregue ao modelo.
- Proibição de enviar, excluir ou alterar mensagens nesta fase.
- Auditoria de consultas sem registrar tokens ou corpos completos.

## MVP 4 — Integração com o computador

Objetivo: permitir que o servidor consulte o PC sem expor acesso irrestrito.

### PC Agent

- Agente leve executado no computador.
- Conexão WebSocket autenticada com o S20 FE.
- Heartbeat, presença e reconexão.
- Catálogo fechado de capacidades.
- Coleta de métricas e informações permitidas.
- Nenhuma execução arbitrária de comandos.

### Steam

- Identificação de jogos instalados.
- Estado e informações relevantes da biblioteca local.
- Histórico e status apresentados na dashboard.

### Sunshine

- Estado do serviço.
- Disponibilidade para streaming.
- Diagnóstico e informações operacionais autorizadas.

## MVP 5 — Impressora 3D

Objetivo: acompanhar a impressora e seus trabalhos pela mesma plataforma.

- Estado da impressora e do trabalho atual.
- Progresso, duração e histórico.
- Alertas e eventos de falha.
- Integração sem comprometer o funcionamento do núcleo.

## Evoluções posteriores

### Event bus

- Eventos internos tipados e desacoplamento entre módulos.
- Processamento assíncrono quando houver benefício real.
- Rastreabilidade de produtores, consumidores e falhas.

### Backups

- Backup do banco, configurações e dados essenciais.
- Política de retenção.
- Verificação e teste de restauração.

### Expansão com microSD

- Dados volumosos, arquivos e backups fora do armazenamento principal.
- Monitoramento de integridade, disponibilidade e capacidade.

### Acesso remoto seguro

- Acesso privado por VPN ou solução equivalente.
- Autenticação forte e nenhuma porta pública desnecessária.
- Auditoria de sessões e ações relevantes.

### Base de conhecimento

- Indexação controlada de documentos autorizados.
- Busca e consulta local.
- Permissões e origem rastreável dos dados.

## Dependências entre marcos

1. O núcleo observável precede todas as integrações.
2. A IA local depende do registro de ferramentas e das regras de segurança.
3. Gmail depende de auditoria, proteção de segredos e IA funcional.
4. PC Agent depende de autenticação, WebSocket e catálogo fechado de capacidades.
5. Steam e Sunshine dependem do PC Agent.
6. Acesso remoto depende de autenticação e observabilidade maduras.

## Stack de validação definida

- Vitest como runner principal.
- Supertest para contratos HTTP do backend Express.
- React Testing Library para comportamento dos componentes.

## Validações de fundação concluídas

- SQLite + Drizzle + `node:sqlite`: migration aplicada e cinco testes aprovados no Termux, cobrindo CRUD, restrições, rollback, webhooks concorrentes, múltiplas conexões e recuperação após interrupção.
- Qwen3-1.7B Q4_K_M + `llama.cpp`: aprovado no S20 FE com geração de `9,89 tokens/s` pela API local, pico de RSS de `1.769.068 kB` e temperatura máxima de `39,0 °C` no ensaio completo.
- O Qwen3-4B Q4 continua fora do caminho crítico e depende de prova própria no aparelho.

## Critério para alterar o roadmap

Uma nova funcionalidade deve indicar:

- problema resolvido;
- dependências;
- dados acessados;
- riscos de segurança e privacidade;
- impacto em logs e auditoria;
- definição de pronto;
- posição sugerida no mapa de implementação.
