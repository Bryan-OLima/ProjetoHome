const REDACTED = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_ENTRIES = 50;
const MAX_STRING_LENGTH = 1_000;

const sensitiveKeyFragments = [
  "password",
  "passwd",
  "token",
  "secret",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "authorization",
  "authentication",
  "cookie",
  "sessionsecret",
  "sessionid",
  "emailbody",
  "attachment",
  "filecontent",
  "prompt",
  "modelresponse",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return sensitiveKeyFragments.some((fragment) => normalized.includes(fragment));
}

function sanitizeString(value: string): string {
  const truncated =
    value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}[TRUNCATED]`
      : value;

  return truncated
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
    .replace(
      /\b(password|passwd|access_token|refresh_token|api_key|token|secret)\s*[:=]\s*[^\s,;&]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/\bCookie\s*:\s*[^\r\n]+/gi, "Cookie: [REDACTED]");
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined") return undefined;
  if (typeof value !== "object") return String(value);
  if (depth >= MAX_DEPTH) return "[MAX_DEPTH]";
  if (seen.has(value)) return "[CIRCULAR]";

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: sanitizeString(value.name),
      message: sanitizeString(value.message),
    };
  }

  seen.add(value);
  if (Array.isArray(value)) {
    const sanitized = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) sanitized.push("[TRUNCATED]");
    return sanitized;
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_OBJECT_ENTRIES)
      .map(([key, item]) => [
        key,
        isSensitiveKey(key)
          ? REDACTED
          : sanitizeValue(item, depth + 1, seen),
      ]),
  );
}

export function sanitizeLogData(value: unknown): unknown {
  return sanitizeValue(value, 0, new WeakSet());
}
