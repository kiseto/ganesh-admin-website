import mysql from "mysql2/promise";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// Run only with explicit approval to repair the XAMPP system permissions table.
if (!process.argv.includes("--approved-mysql-db-repair")) throw new Error("Explicit repair approval flag required.");
const connection = await mysql.createConnection({ host: "127.0.0.1", user: process.env.MARIADB_SETUP_USER || "root", password: process.env.MARIADB_SETUP_PASSWORD || "" });
const backup = path.resolve(".local-setup", `mysql-db-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`);
let locked = false;
try {
  const [variables] = await connection.query<mysql.RowDataPacket[]>("SELECT @@datadir AS datadir");
  const dataDirectory = path.resolve(variables[0].datadir);
  if (dataDirectory.toLowerCase() !== path.resolve("C:/xampp/mysql/data").toLowerCase()) throw new Error("Unexpected MariaDB data directory. Stop for manual review.");
  const [before] = await connection.query("CHECK TABLE mysql.db");
  const [definition] = await connection.query("SHOW CREATE TABLE mysql.db");
  await mkdir(backup, { recursive: false });
  await connection.query("FLUSH TABLES WITH READ LOCK");
  locked = true;
  const hashes: Record<string, string> = {};
  for (const filename of ["db.frm", "db.MAD", "db.MAI"]) {
    const source = path.join(dataDirectory, "mysql", filename);
    const target = path.join(backup, filename);
    await copyFile(source, target);
    const sourceHash = createHash("sha256").update(await readFile(source)).digest("hex");
    const backupHash = createHash("sha256").update(await readFile(target)).digest("hex");
    if (sourceHash !== backupHash) throw new Error("Backup verification failed. No repair performed.");
    hashes[filename] = backupHash;
  }
  await writeFile(path.join(backup, "manifest.json"), JSON.stringify({ table: "mysql.db", before, definition, hashes }, null, 2), { flag: "wx" });
  await connection.query("UNLOCK TABLES");
  locked = false;
  const [repair] = await connection.query("REPAIR NO_WRITE_TO_BINLOG TABLE mysql.db");
  const [after] = await connection.query("CHECK TABLE mysql.db");
  await writeFile(path.join(backup, "result.json"), JSON.stringify({ repair, after }, null, 2), { flag: "wx" });
  console.log("Verified table-file backup:", backup);
  console.log(JSON.stringify({ repair, after }));
  if (JSON.stringify(after).includes('"Msg_text":"OK"')) await connection.query("FLUSH PRIVILEGES");
  else throw new Error("Table is still corrupt. Backup retained; do not continue setup.");
} finally {
  if (locked) await connection.query("UNLOCK TABLES").catch(() => undefined);
  await connection.end();
}
