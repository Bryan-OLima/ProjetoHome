import { resolve } from "node:path";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { openDatabase } from "./database.js";

const databasePath = resolve(process.env.POC_DB_PATH ?? "./data/poc.sqlite");
const migrationsFolder = resolve("./drizzle");
const database = openDatabase(databasePath);

try {
  migrate(database.db, { migrationsFolder });
  console.log(`Migrations applied to ${database.path}`);
} finally {
  database.close();
}
