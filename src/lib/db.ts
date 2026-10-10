import { Pool } from "pg";
import { readSecret } from "./secrets";

const globalForDb = globalThis as unknown as { pool?: Pool };

export function db() {
  globalForDb.pool ??= new Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "portfolio",
    user: process.env.DB_USER ?? "portfolio_app",
    password: readSecret("DB_PASSWORD"),
    max: 5,
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
  });
  return globalForDb.pool;
}
