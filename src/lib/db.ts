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

const globalForCertificates = globalThis as unknown as { certificatePool?: Pool };

export function certificateDatabase() {
  if (!globalForCertificates.certificatePool) {
    const pool = new Pool({
      host: "crt.sh",
      port: 5432,
      database: "certwatch",
      user: "guest",
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15_000,
      query_timeout: 16_000,
      application_name: "felix-pfeiffer.com",
    });
    pool.on("error", () => {});
    globalForCertificates.certificatePool = pool;
  }
  return globalForCertificates.certificatePool;
}
