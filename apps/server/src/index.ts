import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";

const environmentFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

const config = loadConfig();
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const database = openDatabase(config.databasePath);
const app = createApp({ database, version: packageJson.version });

const server = app.listen(config.port, config.host, () => {
  console.info(
    JSON.stringify({
      level: "info",
      service: "server",
      action: "server.started",
      host: config.host,
      port: config.port,
      databasePath: database.path,
    }),
  );
});

function shutdown(signal: string) {
  console.info(
    JSON.stringify({ level: "info", service: "server", action: "server.stop", signal }),
  );
  server.close(() => {
    database.close();
    process.exitCode = 0;
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
