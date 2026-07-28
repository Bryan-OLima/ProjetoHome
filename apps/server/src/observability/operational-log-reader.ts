import type { LogLevel, OperationalLogEvent } from "@projeto-home/contracts";

export interface OperationalLogFilters {
  from?: Date;
  to?: Date;
  level?: LogLevel;
  service?: string;
  action?: string;
  correlationId?: string;
  limit: number;
}

export interface OperationalLogPage {
  items: OperationalLogEvent[];
  truncated: boolean;
}

export interface OperationalLogReader {
  listLogs(filters: OperationalLogFilters): OperationalLogPage;
}
