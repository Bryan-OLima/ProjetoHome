# Regras do Projeto

## Estado destas regras

As regras desta seção são obrigatórias até que uma decisão explícita e documentada as altere. Preferências e escolhas ainda abertas aparecem no fim do documento.

## Stack obrigatória atual

- Node.js.
- npm como gerenciador de pacotes.
- npm workspaces como estrutura do monorepo, inicialmente com `packages/contracts`, `apps/server` e `apps/web`.
- TypeScript.
- Express no backend.
- React no frontend, construído com Vite e `@vitejs/plugin-react`.
- Zod 4 para validação de ambiente, HTTP, ferramentas e mensagens compartilhadas.
- SQLite com o driver nativo `node:sqlite` como banco principal inicial.
- Drizzle ORM, por seu adaptador `node-sqlite`, para schema, consultas e migrações.
- Vitest como runner de testes.
- Supertest para testes da API Express.
- React Testing Library para testes do frontend.
- `llama.cpp` como runtime da IA local.
- Qwen3-1.7B Q4_K_M como modelo padrão, inicialmente em CPU, com quatro threads e contexto de 4096 tokens.
- Qwen3-4B Q4 somente como perfil experimental sujeito a benchmark.
- WebSocket para a conexão persistente entre PC Agent e servidor.
- Samsung S20 FE com Termux como ambiente principal do servidor.
- O aparelho possui 6 GB de RAM nominal e reporta 5.763.296 kB ao sistema.

Não trocar uma tecnologia obrigatória silenciosamente. Uma mudança exige justificativa, impacto, plano de migração e aprovação.

## Limites de implementação

- Implementar somente a etapa ativa descrita em `CURRENT_STATE.md`.
- Não antecipar funcionalidades apenas porque constam no roadmap.
- Preferir uma entrega vertical pequena a uma camada extensa sem uso real.
- Não adicionar dependências de produção sem necessidade clara.
- Não criar abstrações para cenários hipotéticos sem demanda da etapa atual.
- Atualizar a documentação quando uma decisão ou comportamento mudar.

## Regras de segurança

- Nunca criar execução arbitrária de comandos.
- Nunca entregar shell, sistema de arquivos, banco ou credenciais diretamente à IA.
- Toda ferramenta da IA deve estar registrada em uma allowlist.
- Validar autorização e argumentos no backend antes de executar uma ferramenta.
- Aplicar menor privilégio a integrações, processos e credenciais.
- Usar OAuth e escopos mínimos quando disponíveis.
- Não expor a API diretamente à internet.
- Acesso remoto futuro deve usar canal privado e autenticado.
- Segredos devem vir de configuração protegida, nunca do código-fonte.
- Falhar de forma segura: indisponibilidade não pode ampliar permissões.

## Dados proibidos em logs

Nunca registrar:

- senhas;
- tokens de acesso ou atualização;
- chaves de API;
- cookies e cabeçalhos de autenticação;
- segredos de sessão;
- corpos completos de e-mail;
- anexos privados;
- prompts ou respostas integrais que contenham dados pessoais;
- conteúdo completo de arquivos pessoais;
- dados desnecessários para diagnóstico.

Quando for necessário correlacionar um recurso, usar identificador, hash seguro ou metadado mínimo.

## Logging e auditoria

- Logs são parte obrigatória do core.
- Toda requisição deve possuir `requestId` ou identificador equivalente.
- Operações compostas devem compartilhar um identificador de correlação.
- Registrar origem, serviço, ação, resultado, duração e erro sanitizado quando aplicável.
- Ações sensíveis devem gerar evento de auditoria separado.
- A auditoria deve identificar ator, ação, alvo mínimo, horário e resultado.
- Definir retenção e rotação; logs não podem crescer sem limite.
- Falha ao registrar telemetria não deve revelar dados nem derrubar desnecessariamente o fluxo principal.

## IA e ferramentas

- A IA interpreta pedidos; o backend decide o que pode ser executado.
- O modelo local deve ser substituível por meio de um contrato estável.
- Cada ferramenta deve declarar nome, finalidade, esquema de entrada, permissão e limites.
- Argumentos produzidos pelo modelo são sempre dados não confiáveis.
- Limitar tempo de execução, quantidade de resultados e tamanho de conteúdo.
- Operações de escrita exigem desenho e autorização específicos; não existem por padrão.
- Gmail começa somente leitura e sob demanda.
- Respostas podem ser texto ou JSON, mas devem seguir contrato validado.
- O servidor do `llama.cpp` deve escutar somente em interface local por padrão; exposição à rede exige autenticação, CORS restritivo e decisão explícita.
- O baseline aprovado do modelo padrão é geração mínima de 4 tokens/s, pico de RSS abaixo de 2,5 GB e temperatura inferior a 45 °C no ensaio curto.

## PC Agent

- O agente possui identidade própria e conexão autenticada.
- Capacidades são fechadas e versionadas.
- Steam, Sunshine e métricas são capacidades separadas.
- Nenhuma capacidade genérica do tipo "executar comando" é permitida.
- O servidor registra comando permitido, resultado e duração sem capturar dados privados desnecessários.
- Queda do agente não pode derrubar a API principal.

## Banco e armazenamento

- Acesso ao SQLite ocorre pelo adaptador `node-sqlite` do Drizzle e por uma camada controlada de repositórios no backend.
- Apenas o backend abre o arquivo ativo do banco; clientes e integrações acessam somente a API.
- Configurar `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000` e `synchronous=NORMAL`.
- Manter transações curtas e nunca aguardar rede, webhook ou inferência dentro delas.
- Processar webhooks e tarefas demoradas por fila interna quando necessário.
- Manter o arquivo ativo no armazenamento interno do Termux, nunca em microSD ou filesystem de rede.
- Migrações precisam ser versionadas e reversíveis quando possível.
- Consultas externas nunca aceitam SQL arbitrário.
- Acesso a arquivos fica restrito a raízes explicitamente autorizadas.
- Normalizar e validar caminhos para impedir path traversal.
- Backups só são considerados válidos após teste de restauração.

## API

- Validar todas as entradas.
- Usar respostas e erros consistentes.
- Não retornar stack traces ou detalhes sensíveis ao cliente.
- Versionar contratos quando mudanças incompatíveis forem necessárias.
- Endpoints de integração devem ter limites e timeouts.
- Health check não deve expor configuração sensível.

## Frontend

- Tratar carregamento, vazio, indisponibilidade, sucesso e erro.
- Não armazenar tokens sensíveis em mecanismos inseguros do navegador.
- Não esconder falhas importantes do usuário.
- A página de logs deve mostrar apenas dados já sanitizados pelo backend.
- A interface não substitui autorização: o backend sempre valida a ação.

## Qualidade e validação

- Testes devem cobrir comportamento e risco, não apenas linhas de código.
- Toda correção de bug relevante deve incluir teste de regressão quando viável.
- Integrações devem possuir tratamento de timeout e indisponibilidade.
- Antes de concluir uma etapa, testar o fluxo no S20 FE ou justificar a validação equivalente.
- Não declarar uma etapa concluída com verificações obrigatórias falhando.
- Testar concorrência de leitura e escrita e tratar contenção sem perda silenciosa de eventos.

## Documentação e continuidade

- `PROJECT_VISION.md`: por que e para quem o projeto existe.
- `ROADMAP.md`: o que será entregue ao longo do tempo.
- `IMPLEMENTATION_MAP.md`: ordem de construção e critérios de pronto.
- `PROJECT_RULES.md`: restrições que não podem ser ignoradas.
- `ARCHITECTURE.md`: componentes, fluxos e fronteiras.
- `CURRENT_STATE.md`: verdade operacional do momento.

Ao finalizar trabalho material, atualizar `CURRENT_STATE.md`. Alterações arquiteturais também devem atualizar `ARCHITECTURE.md` e, se necessário, o roadmap.

## Decisões fixadas

- Logs operacionais de alto volume ficam em arquivos JSONL rotativos no armazenamento interno. Auditoria, erros relevantes e histórico consultável ficam no SQLite.
- A dashboard usará uma conta administradora local, senha protegida por Argon2id e sessões revogáveis por cookie seguro. HTTPS é obrigatório antes de dados sensíveis ou acesso remoto.
- O processo persistente no Android usa Termux:Boot e um supervisor leve em shell. O Vite é restrito ao desenvolvimento; em produção, o Express serve o frontend compilado.

## Escolhas ainda abertas

Enquanto não forem decididas, não tratá-las como regra:

- solução de acesso remoto.
