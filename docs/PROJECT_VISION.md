# Visão do Projeto

## Resumo

O Projeto Home é uma plataforma pessoal, local e extensível, executada principalmente em um Samsung S20 FE de 6 GB de RAM com Termux. O aparelho funcionará como servidor doméstico para API, banco de dados, interface web, automações, monitoramento e um assistente com IA local.

O sistema deve centralizar informações e serviços pessoais sem transformar a IA no centro da arquitetura. A aplicação continua funcional sem IA; o modelo é apenas um componente autorizado a interpretar pedidos e utilizar ferramentas previamente permitidas.

## Problema que o projeto resolve

Informações pessoais e recursos domésticos ficam espalhados entre computador, e-mail, armazenamento, serviços de jogos e dispositivos. O projeto cria um ponto único para consultar esses dados, acompanhar o estado dos serviços e executar ações controladas, priorizando privacidade e operação local.

## Objetivos

- Reaproveitar o S20 FE como servidor pessoal sempre disponível.
- Preservar memória para o Android, a API e a IA usando componentes embarcados e de baixo consumo.
- Disponibilizar uma dashboard acessível por outros dispositivos da rede.
- Monitorar o próprio servidor, integrações e agentes conectados.
- Consultar dados pessoais sob demanda, inclusive e-mails e arquivos.
- Integrar o computador por meio de um agente com conexão WebSocket.
- Permitir consultas em linguagem natural por uma IA executada localmente.
- Registrar operações relevantes com logs estruturados e auditoria.
- Manter integrações independentes e substituíveis.
- Minimizar o envio de dados privados para serviços externos.

## Experiência desejada

Exemplos de uso:

- "Mostre a saúde do servidor e o espaço disponível."
- "Encontre e resuma os e-mails relacionados ao tema X."
- "Quais jogos estão instalados no meu computador?"
- "Qual foi a última atividade do agente do PC?"
- "Mostre os erros das últimas 24 horas."
- "Quanto espaço existe no armazenamento interno e no microSD?"

As consultas devem produzir respostas legíveis e, quando solicitado, dados estruturados em JSON para consumo pelo frontend.

## Princípios do produto

1. **Local por padrão:** processamento e armazenamento permanecem na rede local sempre que possível.
2. **IA como componente:** a IA interpreta intenções, mas não controla diretamente banco, sistema operacional ou integrações.
3. **Menor privilégio:** cada módulo acessa apenas os dados e ações necessários.
4. **Sob demanda:** integrações sensíveis, como Gmail, são consultadas por solicitação do usuário; não agem automaticamente por padrão.
5. **Observabilidade desde o início:** logs, correlação, monitoramento e auditoria fazem parte do núcleo.
6. **Segurança antes da conveniência:** nenhuma funcionalidade justifica expor credenciais ou permitir execução arbitrária.
7. **Evolução incremental:** cada fase entrega um fluxo completo e testável antes da próxima.
8. **Independência de fornecedor:** integrações e modelos podem ser substituídos sem reescrever o sistema inteiro.

## Escopo planejado

- Backend e API local.
- Frontend web responsivo.
- Banco de dados local.
- Recepção controlada de webhooks e processamento por fila interna.
- Logs, auditoria e central de observabilidade.
- Monitoramento do S20 FE.
- Storage interno e microSD.
- Assistente com IA local e ferramentas permitidas.
- Consulta sob demanda ao Gmail.
- Agente do computador conectado por WebSocket.
- Integrações com Steam e Sunshine.
- Monitoramento e histórico de impressora 3D.
- Event bus interno.
- Backups e retenção de dados.
- Acesso remoto seguro em fase posterior.
- Base de conhecimento pessoal em fase posterior.

## Fora do escopo inicial

- Execução remota arbitrária de comandos.
- Acesso irrestrito da IA ao Gmail, banco de dados ou computador.
- Automações externas autônomas sem confirmação ou regra explícita.
- Exposição direta da API à internet.
- Microserviços distribuídos antes de existir necessidade comprovada.
- Dependência obrigatória de um serviço de IA em nuvem.

## Critérios gerais de sucesso

- O servidor inicia e permanece estável no S20 FE.
- SQLite atende à carga concorrente usando `node:sqlite`, Drizzle ORM, WAL, transações curtas e um único backend proprietário do banco; essa combinação foi validada no aparelho-alvo.
- O Qwen3-1.7B Q4_K_M funciona localmente com desempenho e memória compatíveis com o S20 FE de 6 GB.
- A dashboard funciona em outro dispositivo da rede.
- Falhas e operações importantes podem ser rastreadas por logs correlacionados.
- Credenciais e conteúdo privado não aparecem nos logs.
- A IA só utiliza ferramentas permitidas e validadas pelo backend.
- Integrações podem falhar sem derrubar o núcleo da aplicação.
- O estado do projeto pode ser retomado por outra pessoa ou IA usando a documentação.

## Documentos relacionados

- [Roadmap](./ROADMAP.md)
- [Mapa de implementação](./IMPLEMENTATION_MAP.md)
- [Regras do projeto](./PROJECT_RULES.md)
- [Arquitetura](./ARCHITECTURE.md)
- [Estado atual](./CURRENT_STATE.md)
