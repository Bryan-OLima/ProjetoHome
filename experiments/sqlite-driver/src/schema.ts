import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const webhookJobs = sqliteTable("webhook_jobs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const jobAttempts = sqliteTable("job_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => webhookJobs.id, { onDelete: "cascade" }),
  outcome: text("outcome", { enum: ["success", "failure"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
