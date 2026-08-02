import { useState, type FormEvent } from "react";
import type { AssistantQueryResponse } from "@projeto-home/contracts";
import { queryAssistant } from "./api.js";

type AssistantState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; response: AssistantQueryResponse }
  | { state: "error" };

export function AssistantPanel() {
  const [query, setQuery] = useState("");
  const [assistant, setAssistant] = useState<AssistantState>({ state: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setAssistant({ state: "loading" });
    try {
      setAssistant({ state: "success", response: await queryAssistant(query) });
    } catch {
      setAssistant({ state: "error" });
    }
  }

  return (
    <section className="assistant-panel" aria-labelledby="assistant-title">
      <h2 id="assistant-title">Assistente local</h2>
      <p>{"Pergunte sobre a sa\u00fade atual do servidor ou sobre as capacidades do Projeto Home."}</p>
      <form onSubmit={submit}>
        <label htmlFor="assistant-query">Consulta</label>
        <textarea
          id="assistant-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={4096}
          placeholder={"Ex.: Como est\u00e1 a mem\u00f3ria e a temperatura do servidor?"}
        />
        <button type="submit" disabled={assistant.state === "loading"}>
          {assistant.state === "loading" ? "Consultando\u2026" : "Consultar"}
        </button>
      </form>
      {assistant.state === "error" && (
        <p className="assistant-panel__error" role="alert">
          {"A IA local est\u00e1 indispon\u00edvel ou n\u00e3o respondeu corretamente."}
        </p>
      )}
      {assistant.state === "success" && (
        <div className="assistant-panel__result">
          <strong>{assistant.response.message}</strong>
          {assistant.response.kind === "tool_result" && (
            <details>
              <summary>{"Detalhes técnicos ("}{assistant.response.tool}{")"}</summary>
              <pre>{JSON.stringify(assistant.response.data, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
