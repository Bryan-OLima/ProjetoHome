import express from "express";
import type { DatabaseHandle } from "./database.js";
import { webhookJobs } from "./schema.js";

export function createWebhookApp(database: DatabaseHandle) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));

  app.post("/webhooks/:source", (request, response) => {
    const source = request.params.source;
    if (!source || typeof request.body !== "object" || request.body === null) {
      response.status(400).json({ error: "invalid_webhook" });
      return;
    }

    const id = crypto.randomUUID();
    database.db
      .insert(webhookJobs)
      .values({
        id,
        source,
        status: "pending",
        payload: JSON.stringify(request.body),
        createdAt: new Date(),
      })
      .run();

    response.status(202).json({ id, status: "pending" });
  });

  return app;
}
