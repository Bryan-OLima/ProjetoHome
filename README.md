# Projeto Home

Plataforma pessoal e local para transformar um Samsung Galaxy S20 FE em um servidor doméstico. O projeto reunirá dashboard, monitoramento, armazenamento, automações, integrações e um assistente com IA local, preservando privacidade e controle do usuário.

> **Estado atual:** Etapa 2 em andamento. Logging operacional, auditoria SQLite e migrations foram validados no S20 FE. Consulte o [estado operacional](./docs/CURRENT_STATE.md) antes de implementar.

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
| Frontend | React, TypeScript e Vite |
| Pacotes | npm |
| Estrutura | Monorepo com npm workspaces |
| Contratos | Zod 4 em `packages/contracts` |
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

### Logging e auditoria

- Testes unitários, typecheck e build de produção aprovados no S20 FE.
- Migrations aplicadas com as tabelas `audit_events` e `error_events`.
- `PRAGMA integrity_check` retornou `ok`.
- Uma requisição de health foi correlacionada ao evento JSONL pelo mesmo `requestId`.

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
├── apps/
│   ├── server/
│   └── web/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATE.md
│   ├── IMPLEMENTATION_MAP.md
│   ├── PROJECT_RULES.md
│   ├── PROJECT_VISION.md
│   └── ROADMAP.md
├── experiments/
│   ├── qwen-runtime/
│   └── sqlite-driver/
└── packages/
    └── contracts/
```

As pastas em `experiments/` preservam as provas validadas. Elas são referências técnicas e não representam a estrutura definitiva da aplicação.

## Desenvolvimento

Instale e valide todo o monorepo a partir da raiz:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Para desenvolvimento, use dois terminais:

```bash
npm run dev:server
```

```bash
npm run dev:web
```

Por padrão, a API usa `http://127.0.0.1:3000`, o Vite usa `http://127.0.0.1:5173` e encaminha `/health` para o backend. Copie `apps/server/.env.example` para `.env` somente quando precisar substituir as configurações; segredos nunca devem ser versionados.

Acesse a interface pelo endereço exibido pelo Vite. Não abra `apps/web/index.html` diretamente, pois os módulos do frontend dependem do servidor de desenvolvimento ou do build.

Para um ensaio autorizado na rede local, depois do build dos contratos, use:

```bash
HOST=0.0.0.0 npm run dev -w @projeto-home/server
npm run dev:web -- --host 0.0.0.0
```

Não encaminhe essas portas para a internet.

## Operação no S20 FE

Em operação normal, o Vite não permanece em execução. O build do React é servido pelo mesmo processo Express que expõe a API, na porta `3000`.

```bash
npm ci
npm run build
bash scripts/termux/supervisor.sh
```

O processo atende em `http://0.0.0.0:3000` por padrão; acesse-o pelo IP local do aparelho a partir de outro dispositivo da rede. Os registros de execução e arquivos de PID ficam em `var/`, ignorados pelo Git. Para parar com segurança:

```bash
bash scripts/termux/stop-server.sh
```

### Validação da Etapa 2

Após trazer a versão com logging e auditoria para o aparelho, execute o ensaio completo no Termux:

```bash
bash scripts/termux/validate-stage-2.sh
```

Ele usa banco, logs e porta temporários em `var/validation/`, sem tocar no banco ativo, e valida dependências, tipos, testes, build, migrations, integridade do SQLite e correlação de uma requisição no JSONL.

Para iniciar após reinicializações, instale o complemento Termux:Boot, mantenha o repositório em `~/ProjetoHome` e execute uma vez:

```bash
mkdir -p ~/.termux/boot
cp scripts/termux/boot-projeto-home.sh ~/.termux/boot/projeto-home
chmod 700 ~/.termux/boot/projeto-home
```

O script usa `termux-wake-lock` enquanto o supervisor está ativo e tenta reiniciar o servidor após uma queda, com espera progressiva. A validação desse comportamento no S20 FE ainda é obrigatória antes de concluir a fase.

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
- [Convenções de commit](./docs/COMMIT_CONVENTIONS.md) — formato e categorias obrigatórias para o histórico Git.
- [Instruções para agentes](./AGENTS.md) — fluxo obrigatório para trabalho automatizado no repositório.

## Segurança

- A API não deve ser exposta diretamente à internet.
- A IA nunca recebe acesso direto a shell, banco, filesystem ou credenciais.
- Ferramentas da IA são registradas, validadas, limitadas e auditadas pelo backend.
- Segredos e conteúdo privado não podem aparecer em código, respostas de erro ou logs.
- Gmail começa somente leitura e sob demanda.
- O PC Agent não oferece execução arbitrária de comandos.

## Próximo passo

Implementar a API tipada de consulta aos eventos persistidos, com filtros e política inicial de retenção no SQLite.
