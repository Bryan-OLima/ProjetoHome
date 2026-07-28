# Projeto Home

Plataforma pessoal e local para transformar um Samsung Galaxy S20 FE em um servidor doméstico. O projeto reunirá dashboard, monitoramento, armazenamento, automações, integrações e um assistente com IA local, preservando privacidade e controle do usuário.

> **Estado atual:** fundação documental e provas técnicas concluídas. A aplicação principal está entrando na Etapa 1 — preparação do ambiente e do esqueleto. Consulte o [estado operacional](./docs/CURRENT_STATE.md) antes de implementar.

## Objetivos

- Executar o núcleo do sistema localmente no Android com Termux.
- Disponibilizar API e interface web para dispositivos da rede local.
- Centralizar monitoramento, logs, auditoria e integrações pessoais.
- Usar IA local como componente substituível, sem conceder acesso direto a banco, arquivos, credenciais ou shell.
- Manter cada integração isolada, observável e sujeita ao menor privilégio.

## Ambiente-alvo validado

- Samsung Galaxy S20 FE `SM-G780G`.
- Android 13 e Termux 0.119.0 beta 3, instalado pelo F-Droid.
- ARM64 (`aarch64`).
- 6 GB de RAM nominal; `MemTotal: 5.763.296 kB`.
- Node.js 24.18.0 e npm 11.18.0.
- `node:sqlite` com SQLite 3.53.4.

## Stack aprovada

| Área | Escolha |
|---|---|
| Backend | Node.js, TypeScript e Express |
| Frontend | React e TypeScript |
| Pacotes | npm |
| Banco | SQLite pelo `node:sqlite` |
| ORM | Drizzle ORM |
| Testes | Vitest, Supertest e React Testing Library |
| IA local | `llama.cpp` |
| Modelo padrão | Qwen3-1.7B Q4_K_M |
| Modelo opcional | Qwen3-4B Q4, ainda experimental |
| PC Agent | WebSocket autenticado com capacidades fechadas |

As versões validadas na prova do banco foram `drizzle-orm@1.0.0-rc.4` e `drizzle-kit@1.0.0-rc.4`. Atualizações devem repetir os testes de migration, concorrência e recuperação.

## Configurações essenciais

### SQLite

Cada conexão deve usar:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

Somente o backend abre o arquivo ativo. Transações devem ser curtas e nunca aguardar rede, webhook ou inferência. O banco permanece no armazenamento interno do Termux.

### IA local

O perfil padrão validado usa:

- Qwen3-1.7B Q4_K_M;
- backend de CPU;
- quatro threads;
- contexto inicial de 4096 tokens;
- servidor `llama.cpp` restrito a `127.0.0.1` por padrão.

Qualquer exposição do servidor de IA à rede exige autenticação e CORS restritivo. O Qwen3-4B não pode ser requisito de fluxos essenciais antes de uma prova própria no aparelho.

## Resultados das provas no S20 FE

### Persistência

- Migration aplicada e cinco testes aprovados.
- 50 webhooks simultâneos persistidos sem perda.
- 100 escritas distribuídas entre quatro conexões sem perda.
- Rollback, chaves estrangeiras e recuperação após interrupção aprovados.
- `PRAGMA integrity_check` retornou `ok`.

### IA

- Geração no benchmark: `11,52 tokens/s`.
- Geração pela API local: `9,89 tokens/s`.
- Pico de RSS: `1.769.068 kB`.
- Temperatura máxima no ensaio completo: `39,0 °C`.
- Resposta coerente em português e encerramento normal.

## Estrutura atual

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATE.md
│   ├── IMPLEMENTATION_MAP.md
│   ├── PROJECT_RULES.md
│   ├── PROJECT_VISION.md
│   └── ROADMAP.md
└── experiments/
    ├── qwen-runtime/
    └── sqlite-driver/
```

As pastas em `experiments/` preservam as provas validadas. Elas são referências técnicas e não representam a estrutura definitiva da aplicação.

## Executando as provas

### SQLite e Drizzle

```bash
cd experiments/sqlite-driver
npm ci
npm run typecheck
npm test
npm run db:migrate
```

### Qwen no Termux

O modelo GGUF não é versionado no repositório. Consulte as instruções, hash e critérios em [experiments/qwen-runtime/README.md](./experiments/qwen-runtime/README.md).

## Documentação

- [Visão do projeto](./docs/PROJECT_VISION.md) — propósito, objetivos e limites do produto.
- [Roadmap](./docs/ROADMAP.md) — entregas planejadas e evolução dos MVPs.
- [Mapa de implementação](./docs/IMPLEMENTATION_MAP.md) — ordem operacional e definições de pronto.
- [Regras do projeto](./docs/PROJECT_RULES.md) — stack e restrições obrigatórias.
- [Arquitetura](./docs/ARCHITECTURE.md) — componentes, fluxos e fronteiras de confiança.
- [Estado atual](./docs/CURRENT_STATE.md) — concluído, em andamento, pendências e próximo passo.
- [Instruções para agentes](./AGENTS.md) — fluxo obrigatório para trabalho automatizado no repositório.

## Segurança

- A API não deve ser exposta diretamente à internet.
- A IA nunca recebe acesso direto a shell, banco, filesystem ou credenciais.
- Ferramentas da IA são registradas, validadas, limitadas e auditadas pelo backend.
- Segredos e conteúdo privado não podem aparecer em código, respostas de erro ou logs.
- Gmail começa somente leitura e sob demanda.
- O PC Agent não oferece execução arbitrária de comandos.

## Próximo passo

Definir a estrutura do repositório, a ferramenta de build do frontend e a biblioteca de validação de esquemas. Depois, iniciar a primeira entrega vertical da Etapa 1: backend com health check e `requestId`, frontend com status do servidor e SQLite configurado por Drizzle.
