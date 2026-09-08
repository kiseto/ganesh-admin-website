import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scriptDatabase } from "./environment.ts";
import { initialContent } from "../lib/content/seed.ts";
import { contentSnapshotSchema } from "../lib/content/schema.ts";
import type { RowDataPacket } from "mysql2/promise";

const pool = scriptDatabase();
try {
  for (const table of ["site_drafts", "site_publications"]) {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT content, version FROM ${table} WHERE site_key = 'ganesh-main'`);
    const content = contentSnapshotSchema.parse(typeof rows[0].content === "string" ? JSON.parse(rows[0].content) : rows[0].content);
    assert.deepEqual(content, contentSnapshotSchema.parse(initialContent), "Original content was not restored; do not overwrite any user changes.");
    console.log(`${table}: version ${rows[0].version}; original content verified (${content.products.length} products, ${content.fabrics.length} fabrics).`);
  }
  const html = await readFile("../ganesh-website/.next-build/server/app/index.html", "utf8");
  assert.ok(!html.includes("Browser smoke") && !html.includes("CMS smoke"), "Temporary test content is present in the public build; rebuild after restoring content.");
  console.log("Public build contains no temporary smoke-test hero text.");
} finally { await pool.end(); }
