import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { scriptDatabase } from "./environment.ts";
import { extendSnapshot } from "../lib/content/extend-snapshot.ts";

const pool = scriptDatabase();
const connection = await pool.getConnection();
let changed = false;
try {
  await connection.beginTransaction();
  const records: Array<{ table: string; row: RowDataPacket; next: ReturnType<typeof extendSnapshot> }> = [];
  for (const table of ["site_drafts", "site_publications"]) {
    const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${table} WHERE site_key = 'ganesh-main' FOR UPDATE`);
    if (!rows[0]) throw new Error("Seed the site before extending its content.");
    const content = typeof rows[0].content === "string" ? JSON.parse(rows[0].content) : rows[0].content;
    const next = extendSnapshot(content);
    if (JSON.stringify(next) !== JSON.stringify(content)) records.push({ table, row: rows[0], next });
  }
  if (records.length) {
    await mkdir(".local-setup", { recursive: true });
    const path = `.local-setup/content-before-extension-${Date.now()}.json`;
    const backup = JSON.stringify(records.map(({ table, row }) => ({ table, row })), null, 2);
    await writeFile(path, backup, { flag: "wx" });
    const sha = (value: string) => createHash("sha256").update(value).digest("hex");
    if (sha(backup) !== sha(await readFile(path, "utf8"))) throw new Error("Backup verification failed; migration cancelled.");
    for (const { table, row, next } of records) {
      const version = Number(row.version) + 1;
      await connection.execute(`UPDATE ${table} SET content = ?, version = ? WHERE site_key = 'ganesh-main'`, [JSON.stringify(next), version]);
      if (table === "site_publications") {
        await connection.execute("INSERT INTO content_revision_history (site_key, schema_version, content, version) VALUES ('ganesh-main', ?, ?, ?)", [next.schemaVersion, JSON.stringify(next), version]);
      }
      await connection.execute("INSERT INTO audit_logs (action, metadata) VALUES ('content_fields_extended', ?)", [JSON.stringify({ table, version, backup: path })]);
      console.log(`${table}: added missing content fields at version ${version}. Existing content preserved.`);
    }
    console.log(`Verified rollback backup: ${path}`);
    changed = true;
  } else console.log("Content extension already applied. Nothing changed.");
  await connection.commit();
} catch (failure) { await connection.rollback(); throw failure; }
finally { connection.release(); await pool.end(); }
if (changed && process.env.PUBLIC_SITE_REVALIDATE_URL && process.env.PUBLIC_SITE_REVALIDATE_SECRET) {
  try {
    const result = await fetch(process.env.PUBLIC_SITE_REVALIDATE_URL, { method: "POST", headers: { authorization: `Bearer ${process.env.PUBLIC_SITE_REVALIDATE_SECRET}` }, signal: AbortSignal.timeout(8000) });
    console.log(result.ok ? "Public cache refreshed." : "Content migrated; retry public cache refresh in admin.");
  } catch { console.log("Content migrated; public cache refresh will retry on the next publish."); }
}
