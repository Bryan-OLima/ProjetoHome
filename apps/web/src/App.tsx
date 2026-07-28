import { ServerStatusCard } from "./ServerStatusCard.js";

export function App() {
  return (
    <main className="page-shell">
      <header>
        <span className="eyebrow">Servidor pessoal</span>
        <h1>Projeto Home</h1>
        <p>O núcleo local começa pela saúde do sistema.</p>
      </header>
      <ServerStatusCard />
    </main>
  );
}
