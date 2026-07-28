import {
  ListOperationalLogsResponseSchema,
  type ListOperationalLogsQuery,
  type ListOperationalLogsResponse,
} from "@projeto-home/contracts";
import type { OperationalLogReader } from "./operational-log-reader.js";

export interface ListOperationalLogs {
  execute(query: ListOperationalLogsQuery): ListOperationalLogsResponse;
}

export function createListOperationalLogs(dependencies: {
  reader: OperationalLogReader;
}): ListOperationalLogs {
  return {
    execute(query) {
      return ListOperationalLogsResponseSchema.parse(
        dependencies.reader.listLogs({
          limit: query.limit,
          ...(query.level ? { level: query.level } : {}),
          ...(query.service ? { service: query.service } : {}),
          ...(query.action ? { action: query.action } : {}),
          ...(query.correlationId
            ? { correlationId: query.correlationId }
            : {}),
          ...(query.from ? { from: new Date(query.from) } : {}),
          ...(query.to ? { to: new Date(query.to) } : {}),
        }),
      );
    },
  };
}
