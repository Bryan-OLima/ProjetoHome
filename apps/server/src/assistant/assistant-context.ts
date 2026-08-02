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
    "Para perguntas cotidianas que nao exigem dados atuais do sistema, converse de modo natural, util e direto.",
    "Para perguntas sobre o Projeto Home, use os fatos fornecidos. Nao invente capacidades, integracoes, numeros ou acoes executadas.",
    "Nao afirme dados atuais do servidor, acesso a fontes externas ou acoes no sistema sem resultado autorizado fornecido pelo backend.",
    "Se a pergunta pedir um recurso indisponivel do Projeto Home, explique isso de forma direta e ofereca somente capacidades existentes.",
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

export function isServerOnlineQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.includes("servidor esta online")
    || normalized.includes("server esta online")
    || (normalized.includes("servidor") && normalized.includes("online"));
}

export function isRequestDurationQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.includes("tempo demora uma requisicao")
    || normalized.includes("tempo de requisicao")
    || normalized.includes("duracao da requisicao")
    || normalized.includes("latencia da requisicao");
}

export function extractExplicitMathExpression(query: string): string | undefined {
  const normalized = query
    .replace(/(\d)\s*[x\u00d7]\s*(\d)/g, "$1 * $2")
    .replace(/\u00f7/g, "/")
    .replace(/,/g, ".");
  const candidate = normalized.match(/[0-9][0-9.\s()+\-*/%]*/)?.[0]?.trim();
  return candidate && /[+\-*/%]/.test(candidate) ? candidate : undefined;
}

function normalizeQuery(query: string): string {
  return query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
