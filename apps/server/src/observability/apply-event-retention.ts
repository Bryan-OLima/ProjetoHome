import type {
  PersistedEventRepository,
  RetentionResult,
} from "./event-repository.js";

export interface EventRetentionSettings {
  auditRetentionDays: number;
  errorRetentionDays: number;
  batchSize: number;
}

export function applyEventRetention(
  repository: PersistedEventRepository,
  settings: EventRetentionSettings,
  now: Date = new Date(),
): RetentionResult {
  return repository.pruneExpired({
    auditBefore: subtractDays(now, settings.auditRetentionDays),
    errorBefore: subtractDays(now, settings.errorRetentionDays),
    batchSize: settings.batchSize,
  });
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1_000);
}
