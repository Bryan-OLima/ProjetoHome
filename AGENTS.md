# Instruções para agentes

## Escopo

Este arquivo vale para todo o repositório. Instruções mais específicas em um futuro `AGENTS.md` de subdiretório prevalecem apenas dentro daquele subdiretório.

## Fonte de verdade

Antes de planejar ou alterar código, leia nesta ordem:

1. `docs/CURRENT_STATE.md` — etapa ativa, trabalho concluído, pendências e próximo passo.
2. A etapa correspondente em `docs/IMPLEMENTATION_MAP.md` — entregas, testes e definição de pronto.
3. `docs/PROJECT_RULES.md` — restrições obrigatórias de stack, segurança, dados e qualidade.
4. `docs/ARCHITECTURE.md` — componentes, responsabilidades e fronteiras de confiança.
5. `docs/ROADMAP.md` e `docs/PROJECT_VISION.md` — sequência do produto e intenção geral.

Se houver contradição, não escolha silenciosamente. Preserve a regra mais restritiva, registre o conflito e peça uma decisão quando ela for necessária para continuar.

## Estado operacional

- A etapa ativa é a indicada em `docs/CURRENT_STATE.md`.
- Implemente somente a etapa ativa e o menor incremento vertical que satisfaça seus critérios.
- Não antecipe itens listados em **Não iniciar ainda**, mesmo que já existam provas de conceito.
- Decisões marcadas como pendentes não podem ser transformadas em padrão sem justificativa e aprovação.
- `experiments/sqlite-driver/` e `experiments/qwen-runtime/` são provas validadas e referências técnicas. Não são a estrutura da aplicação principal.

## Fluxo obrigatório de trabalho

1. Leia o estado atual e identifique a definição de pronto aplicável.
2. Inspecione a árvore e alterações existentes; preserve trabalho do usuário e mudanças fora do escopo.
3. Declare suposições relevantes e limite o trabalho à entrega solicitada.
4. Implemente uma fatia pequena, testável e observável.
5. Execute verificações proporcionais ao risco: tipos, testes, build e ensaios específicos da plataforma.
6. Corrija falhas causadas pela mudança antes de encerrar.
7. Atualize `docs/CURRENT_STATE.md` após qualquer trabalho material.
8. Atualize `docs/ARCHITECTURE.md` quando fronteiras ou decisões arquiteturais mudarem; atualize roadmap e mapa quando escopo ou ordem mudarem.
9. Ao entregar, informe arquivos alterados, validações executadas, resultados e pendências reais.

Não marque uma etapa como concluída com testes obrigatórios falhando, sem evidência no ambiente-alvo ou apenas porque parte da infraestrutura foi criada.

## Stack e decisões fixadas

- Node.js, npm e TypeScript. Não introduza Yarn ou pnpm.
- Express no backend e React no frontend.
- Vitest, Supertest e React Testing Library para validação.
- SQLite pelo `node:sqlite`, com Drizzle ORM e migrations versionadas.
- A prova aprovada usou `drizzle-orm@1.0.0-rc.4` e `drizzle-kit@1.0.0-rc.4`; uma atualização exige repetir migration, concorrência e recuperação.
- `llama.cpp` como runtime local.
- Qwen3-1.7B Q4_K_M como modelo padrão validado: CPU, quatro threads e contexto inicial de 4096 tokens.
- Qwen3-4B Q4 permanece experimental e não pode ser requisito de fluxos essenciais.
- Samsung S20 FE de 6 GB com Termux é o ambiente principal de produção.

Não troque tecnologia fixada sem registrar motivação, impacto, migração, validação e aprovação.

## Banco, concorrência e armazenamento

- Apenas o backend abre o arquivo SQLite ativo; frontend, webhooks, integrações e agentes acessam a API.
- Ao abrir cada conexão, configure `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000` e `synchronous=NORMAL`.
- Mantenha transações curtas. Nunca aguarde rede, webhook, filesystem externo ou inferência dentro de uma transação.
- Responda rapidamente a webhooks e use fila interna para trabalho demorado.
- Mantenha o banco ativo no armazenamento interno do Termux, nunca em microSD, armazenamento compartilhado ou filesystem de rede.
- Não aceite SQL arbitrário. Valide caminhos e restrinja arquivos a raízes autorizadas.
- Backups só são válidos depois de um teste de restauração.

## IA e integrações

- A IA interpreta; o backend autoriza e executa.
- Nunca entregue ao modelo acesso direto a shell, banco, filesystem, credenciais ou clientes externos.
- Toda ferramenta deve ter nome, esquema de entrada, permissão, limites, timeout, handler e política de auditoria.
- Trate argumentos e conteúdo produzidos pelo modelo como entrada não confiável.
- O servidor do `llama.cpp` deve escutar em `127.0.0.1` por padrão. Exposição à rede exige autenticação e CORS restritivo.
- A indisponibilidade do modelo não pode derrubar dashboard, monitoramento ou API principal.
- Gmail começa somente leitura e sob demanda. O PC Agent oferece capacidades fechadas; nunca uma função genérica de executar comandos.

## Segurança, privacidade e observabilidade

- Não exponha a API diretamente à internet.
- Use menor privilégio, validação de entrada, limites e timeouts em toda fronteira.
- Segredos ficam fora do código e nunca aparecem em respostas, erros ou logs.
- Não registre senhas, tokens, cookies, cabeçalhos de autenticação, corpos completos de e-mail, anexos, arquivos pessoais ou prompts/respostas sensíveis.
- Toda requisição recebe `requestId`; fluxos encadeados ou assíncronos recebem `correlationId`.
- Ações sensíveis geram auditoria separada, sanitizada e com retenção definida.
- Frontend não é fronteira de autorização; o backend sempre revalida.
- Falhas devem ser isoladas e seguras, sem ampliar permissões ou derrubar componentes independentes.

## Qualidade e recursos do aparelho

- Teste comportamento e risco, não apenas cobertura de linhas.
- Correções relevantes devem incluir regressão quando viável.
- Teste estados de sucesso, vazio, carregamento, indisponibilidade e erro onde forem aplicáveis.
- Mudanças dependentes de Android, Termux, `node:sqlite`, filesystem ou IA precisam ser testadas no S20 FE ou ter justificativa explícita de equivalência.
- Preserve RAM para Android e serviços essenciais. Evite processos residentes, paralelismo e dependências pesadas sem benefício medido.
- Para o modelo padrão, preserve como referência: geração mínima de 4 tokens/s, pico de RSS abaixo de 2,5 GB e temperatura inferior a 45 °C no ensaio curto.

## Convenções de repositório

- Use inglês para nomes de código e contratos; use português claro na documentação e comunicação com o usuário.
- Prefira módulos pequenos com responsabilidade explícita a abstrações antecipadas.
- Não adicione dependência de produção sem necessidade demonstrável.
- Não versione `node_modules`, bancos, modelos GGUF, resultados temporários, segredos ou artefatos gerados sem necessidade.
- Preserve as provas de conceito; remova-as somente após decisão explícita e quando suas evidências estiverem registradas em outro lugar.
