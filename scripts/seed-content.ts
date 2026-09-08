import { scriptDatabase } from "./environment.ts";
import type { RowDataPacket } from "mysql2/promise";
import { initialContent } from "../lib/content/seed.ts";
import { parseContentSnapshot } from "../lib/content/schema.ts";

const content = parseContentSnapshot(initialContent);
const pool = scriptDatabase();
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [rows] = await connection.query<RowDataPacket[]>("SELECT site_key FROM site_drafts WHERE site_key = 'ganesh-main' FOR UPDATE");
  const [publications] = await connection.query<RowDataPacket[]>("SELECT site_key FROM site_publications WHERE site_key = 'ganesh-main' FOR UPDATE");
  if (rows.length || publications.length) {
    if (!rows.length || !publications.length) throw new Error("Partial content exists. Restore the missing snapshot from a verified backup; seed will not overwrite it.");
    console.log("Existing draft and publication preserved. Nothing seeded.");
  } else {
    const json = JSON.stringify(content);
    await connection.execute("INSERT INTO site_drafts (site_key, schema_version, content, version) VALUES ('ganesh-main', ?, ?, 1)", [content.schemaVersion, json]);
    await connection.execute("INSERT INTO site_publications (site_key, schema_version, content, version) VALUES ('ganesh-main', ?, ?, 1)", [content.schemaVersion, json]);
    await connection.execute("INSERT INTO content_revision_history (site_key, schema_version, content, version) VALUES ('ganesh-main', ?, ?, 1)", [content.schemaVersion, json]);
    await connection.execute("INSERT INTO audit_logs (action, metadata) VALUES ('initial_seed', ?)", [JSON.stringify({ version: 1, source: "public website fixture" })]);
    console.log("Seeded public content, private draft and initial revision atomically.");
  }
  await connection.commit();
} catch (error) { await connection.rollback(); throw error; }
finally { connection.release(); await pool.end(); }
