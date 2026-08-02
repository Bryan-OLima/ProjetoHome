interface RouteDocumentation {
  method: "GET" | "POST";
  path: string;
  description: string;
  query?: string;
  body?: string;
  response: string;
}

const apiRoutes: readonly RouteDocumentation[] = [
  { method: "GET", path: "/health", description: "Confirma que a API e o banco estao saudaveis.", response: "status, version, uptimeSeconds, database, timestamp e requestId" },
  { method: "GET", path: "/api/monitoring/metrics", description: "Coleta sob demanda uptime, memoria, swap, armazenamento e temperaturas disponiveis.", response: "Metricas numericas com status available ou unavailable." },
  { method: "GET", path: "/api/storage/locations", description: "Mostra capacidade, uso e disponibilidade do armazenamento interno autorizado.", response: "Uma localizacao interna com status e capacidade em bytes." },
  { method: "GET", path: "/api/storage/internal/items", description: "Lista, sem recursao, ate 100 itens da raiz interna autorizada.", query: "limit: 1 a 100 (padrao 50)", response: "Itens com nome, tipo, tamanho, data de modificacao e truncated." },
  { method: "GET", path: "/api/observability/events", description: "Consulta eventos persistidos de auditoria e erros relevantes.", query: "kind, from, to, service, action, correlationId, cursor e limit (1 a 100; padrao 50)", response: "items e nextCursor quando houver uma proxima pagina." },
  { method: "GET", path: "/api/observability/operational-logs", description: "Consulta logs operacionais JSONL mais recentes, com leitura limitada.", query: "from, to, level, service, action, correlationId e limit (1 a 100; padrao 50)", response: "items e truncated quando a janela segura de leitura for atingida." },
  { method: "POST", path: "/api/assistant/query", description: "Envia uma pergunta ao assistente local. Ele usa dados do sistema somente em caminhos autorizados.", body: '{ "query": "Como esta a memoria disponivel?" }', response: "Mensagem, requestId e correlationId. Dados internos de ferramentas nao sao enviados ao navegador." },
];

export function DocumentationPage() {
  return (
    <main className="page-shell page-shell--wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">Referencia local</span>
          <h1>Documentacao</h1>
          <p>Rotas publicas atuais do Projeto Home para consulta e testes manuais.</p>
        </div>
        <nav className="page-navigation" aria-label="Navegacao principal">
          <a className="navigation-link" href="/">Visao geral</a>
          <a className="navigation-link" href="/logs">Logs</a>
        </nav>
      </header>
      <section className="documentation-intro" aria-label="Uso da API">
        <h2>Como usar</h2>
        <p>Todas as respostas incluem um <code>requestId</code>. Erros usam um envelope seguro com codigo e mensagem publica.</p>
        <p>A API foi feita para a rede local. Nao exponha estas rotas diretamente a internet.</p>
      </section>
      <section className="documentation-routes" aria-labelledby="documentation-routes-title">
        <h2 id="documentation-routes-title">Rotas da API</h2>
        <div className="documentation-route-list">
          {apiRoutes.map((route) => <RouteCard key={`${route.method}-${route.path}`} route={route} />)}
        </div>
      </section>
      <section className="documentation-pages" aria-labelledby="documentation-pages-title">
        <h2 id="documentation-pages-title">Paginas da interface</h2>
        <ul>
          <li><code>/</code> — visao geral, monitoramento, armazenamento e assistente.</li>
          <li><code>/logs</code> — consulta de eventos persistidos e logs operacionais.</li>
          <li><code>/documentation</code> — esta referencia de rotas publicas.</li>
        </ul>
      </section>
    </main>
  );
}

function RouteCard({ route }: { route: RouteDocumentation }) {
  return (
    <article className="documentation-route">
      <div className="documentation-route__heading">
        <span className={`http-method http-method--${route.method.toLowerCase()}`}>{route.method}</span>
        <code>{route.path}</code>
      </div>
      <p>{route.description}</p>
      {route.query ? <RouteDetail label="Parametros" value={route.query} /> : null}
      {route.body ? <RouteDetail label="Corpo" value={route.body} code /> : null}
      <RouteDetail label="Resposta" value={route.response} />
    </article>
  );
}

function RouteDetail({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return <div className="documentation-route__detail"><strong>{label}</strong>{code ? <code>{value}</code> : <span>{value}</span>}</div>;
}
