import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | null = null;

/** Returns the shared MySQL pool, or null when local CMS credentials are absent. */
export function getMySqlPool(): Pool | null {
  const host = process.env.MYSQL_HOST;
  const database = process.env.MYSQL_DATABASE;
  const user = process.env.MYSQL_USER;
  if (!host || !database || !user) return null;

  if (!pool) {
    pool = mysql.createPool({
      host,
      port: Number(process.env.MYSQL_PORT || 3306),
      database,
      user,
      password: process.env.MYSQL_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      timezone: "Z",
      ssl: process.env.MYSQL_SSL === "true" ? {} : undefined,
    });
  }

  return pool;
}

export function isMySqlConfigured() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER);
}

export type DbRow = Record<string, unknown>;

export function jsonColumn(value: unknown) {
  return typeof value === "string" ? JSON.parse(value) : value;
}
