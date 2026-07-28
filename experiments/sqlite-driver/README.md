# Prova de conceito: Drizzle + node:sqlite

Esta pasta valida a persistência escolhida para o Projeto Home sem alterar a aplicação principal.

## Ambiente-alvo confirmado

- Samsung Galaxy S20 FE `SM-G780G`.
- Android 13.
- Termux 0.119.0 beta 3, instalado pelo F-Droid no armazenamento interno.
- ARM64 (`aarch64`).
- 6 GB de RAM nominal (`MemTotal: 5.763.296 kB`).
- Node.js 24.18.0.
- npm 11.18.0.
- `node:sqlite` com SQLite 3.53.4.

## O que é testado

- instalação do Drizzle sem driver SQLite externo;
- geração e aplicação de migrations;
- banco persistente em arquivo;
- WAL, chaves estrangeiras, `busy_timeout` e modo síncrono;
- CRUD tipado;
- rollback e integridade referencial;
- 50 webhooks simultâneos via Express e Supertest;
- quatro conexões escritoras concorrentes;
- recuperação após interrupção durante uma transação;
- `PRAGMA integrity_check`.

## Execução no S20 FE

Copie esta pasta para o aparelho ou clone o repositório. Dentro dela, execute:

```bash
npm install
npm run typecheck
npm test
npm run db:migrate
```

O teste gera a migration antes de executar a suíte. Bancos temporários são criados no diretório temporário do sistema e removidos ao final.

O comando `db:migrate` mantém apenas um banco demonstrativo em `data/poc.sqlite`. A pasta `data/` é ignorada pelo Git.

## Resultado de referência

No ambiente de desenvolvimento, com Node.js 24.12.0 e npm 11.16.0:

- typecheck aprovado;
- três arquivos e cinco testes aprovados;
- 50 requisições de webhook simultâneas persistidas;
- 100 escritas distribuídas entre quatro conexões persistidas;
- transação interrompida revertida e `integrity_check: ok`;
- migration aplicada ao banco persistente;
- auditoria npm sem vulnerabilidades conhecidas.

Esse resultado confirma a implementação da prova, mas a decisão final depende da repetição no S20 FE, que é o ambiente-alvo.

## Critério de aprovação

O driver é aprovado se:

- a instalação não exigir patches ou compilação nativa;
- o typecheck terminar sem erros;
- todos os testes passarem repetidamente;
- nenhum webhook ou escrita concorrente for perdido;
- a recuperação retornar `integrity_check: ok`;
- não houver crescimento contínuo de memória em execuções repetidas.

## Medição opcional de memória

Em outro terminal, durante `npm test`, acompanhe o processo com:

```bash
ps -A -o PID,RSS,NAME | grep node
```

O objetivo desta prova não é definir um limite final de memória, mas detectar crescimento anormal ou incompatibilidade no aparelho.
