import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { scriptDatabase } from "./environment.ts";
import type { RowDataPacket } from "mysql2/promise";

const pool = scriptDatabase();
const connection = await pool.getConnection();
try {
  const [lock] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK('ganesh_cms_migrations', 15) AS acquired");
  if (Number(lock[0].acquired) !== 1) throw new Error("Another migration is running. Retry later.");
  const [tracking] = await connection.query<RowDataPacket[]>("SHOW TABLES LIKE 'schema_migrations'");
  if (!tracking.length) await connection.query("CREATE TABLE schema_migrations (name VARCHAR(180) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB");
  for (const name of (await readdir("database/migrations")).filter((file) => file.endsWith(".sql")).sort()) {
    const sql = await readFile(`database/migrations/${name}`, "utf8");
    const checksum = createHash("sha256").update(sql.replaceAll("\r\n", "\n")).digest("hex");
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT checksum FROM schema_migrations WHERE name = ?", [name]);
    if (rows.length) {
      if (rows[0].checksum !== checksum) throw new Error(`Applied migration ${name} changed. Restore it and create a new migration.`);
      console.log(`Already applied: ${name}`);
      continue;
    }
    // Plain repository DDL only, no procedures/delimiters or semicolons in strings.
    // MariaDB DDL commits implicitly; every statement must be repeatable after interruption.
    for (const statement of sql.replace(/^\s*--.*$/gm, "").split(";").map((part) => part.trim()).filter(Boolean)) await connection.query(statement);
    await connection.execute("INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)", [name, checksum]);
    console.log(`Applied: ${name}`);
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK('ganesh_cms_migrations')").catch(() => undefined);
  connection.release();
  await pool.end();
}
