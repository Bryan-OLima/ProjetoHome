const projectFacts = [
  "O Projeto Home e uma plataforma pessoal e local executada principalmente em um Samsung S20 FE com Termux.",
  "A dashboard atual mostra estado do servidor, logs, monitoramento e armazenamento interno.",
  "A unica consulta atual de dados em tempo real e system.get_metrics: uptime, memoria, swap, armazenamento e temperaturas disponiveis.",
  "Calculos aritmeticos simples sao executados localmente pela ferramenta math.evaluate.",
  "Gmail, PC Agent, Steam, Sunshine, impressora 3D, automacoes e controle de ar-condicionado ainda nao estao disponiveis.",
  "A IA nao acessa diretamente shell, arquivos, banco, credenciais ou servicos externos.",
].join("\n");

export function createAssistantResponsePrompt(query: string): string {
  return [
    "/no_think Voce responde em portugues como o assistente do Projeto Home.",
    "Use somente os fatos e dados fornecidos abaixo. Nao invente capacidades, integracoes, numeros ou acoes executadas.",
    "Se a pergunta pedir algo indisponivel, explique isso de forma direta e ofereca somente capacidades existentes.",
    "Quando houver dados atuais autorizados, explique-os de forma clara. Nao afirme dados atuais quando eles nao estiverem presentes.",
    "Responda em no maximo tres frases e 480 caracteres, sem markdown.",
    `\nFatos confiaveis:\n${projectFacts}`,
    `\nPergunta do usuario:\n${query}`,
  ].join("\n");
}

export function isExplicitMetricsQuery(query: string): boolean {
  const normalized = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return [
    "memoria",
    "temperatura",
    "cpu",
    "bateria",
    "swap",
    "armazenamento",
    "espaco",
    "uptime",
    "como esta o servidor",
    "saude do servidor",
    "status do servidor",
  ].some((term) => normalized.includes(term));
}

export function extractExplicitMathExpression(query: string): string | undefined {
  const normalized = query
    .replace(/(\d)\s*[x\u00d7]\s*(\d)/g, "$1 * $2")
    .replace(/\u00f7/g, "/")
    .replace(/,/g, ".");
  const candidate = normalized.match(/[0-9][0-9.\s()+\-*/%]*/)?.[0]?.trim();
  return candidate && /[+\-*/%]/.test(candidate) ? candidate : undefined;
}
