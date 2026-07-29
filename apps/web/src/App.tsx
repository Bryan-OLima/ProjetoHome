import { ServerStatusCard } from "./ServerStatusCard.js";
import { LogsPage } from "./LogsPage.js";
import { RecentActivityPanel } from "./RecentActivityPanel.js";
import { SystemMetricsPanel } from "./SystemMetricsPanel.js";

export function App() {
  if (window.location.pathname === "/logs") {
    return <LogsPage />;
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Servidor pessoal</span>
          <h1>Projeto Home</h1>
          <p>O núcleo local começa pela saúde do sistema.</p>
        </div>
        <a className="navigation-link" href="/logs">
          Ver logs
        </a>
      </header>
      <ServerStatusCard />
      <SystemMetricsPanel />
      <RecentActivityPanel />
    </main>
  );
}
