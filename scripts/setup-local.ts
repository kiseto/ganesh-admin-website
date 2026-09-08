import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "../lib/auth/password.ts";

// Explicit local XAMPP setup. Never overwrites env files or existing account credentials.
const adminRoot = process.cwd();
const publicRoot = path.resolve(process.env.PUBLIC_REPO_PATH || "../ganesh-website");
const adminEnv = path.join(adminRoot, ".env.local");
const publicEnv = path.join(publicRoot, ".env.local");
for (const file of [adminEnv, publicEnv]) {
  if (await access(file).then(() => true, () => false)) throw new Error(`${file} already exists. Preserve it and use db:migrate / seed:content instead.`);
}
await access(path.join(publicRoot, "package.json"));
const root = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user: process.env.MARIADB_SETUP_USER || "root", password: process.env.MARIADB_SETUP_PASSWORD || "" });
try {
  const [existing] = await root.query<mysql.RowDataPacket[]>("SELECT User FROM mysql.user WHERE User = 'ganesh_app' AND Host = '127.0.0.1'");
  if (existing.length) {
    const [grants] = await root.query<mysql.RowDataPacket[]>("SHOW GRANTS FOR 'ganesh_app'@'127.0.0.1'");
    const onlyUnusedAccount = grants.every((row) => String(Object.values(row)[0]).startsWith("GRANT USAGE ON *.*"));
    if (!process.argv.includes("--resume-unconfigured-app-user") || !onlyUnusedAccount) throw new Error("ganesh_app already exists. Configure its existing credentials manually; normal setup never resets them.");
  }
  await root.query("CREATE DATABASE IF NOT EXISTS ganesh_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  Object.assign(process.env, { MYSQL_HOST: "127.0.0.1", MYSQL_PORT: "3306", MYSQL_DATABASE: "ganesh_cms", MYSQL_USER: process.env.MARIADB_SETUP_USER || "root", MYSQL_PASSWORD: process.env.MARIADB_SETUP_PASSWORD || "" });
  await import("./migrate.ts");
  await import("./seed-content.ts");
  const dbPassword = randomBytes(32).toString("hex");
  const sharedSecret = randomBytes(32).toString("hex");
  await root.query(existing.length ? "ALTER USER 'ganesh_app'@'127.0.0.1' IDENTIFIED BY ?" : "CREATE USER 'ganesh_app'@'127.0.0.1' IDENTIFIED BY ?", [dbPassword]);
  await root.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ganesh_cms.* TO 'ganesh_app'@'127.0.0.1'");
  const email = process.env.ADMIN_EMAIL || "admin@ganesh.local";
  const password = randomBytes(18).toString("base64url");
  const [accounts] = await root.query<mysql.RowDataPacket[]>("SELECT id FROM ganesh_cms.admin_profiles WHERE email = ?", [email]);
  if (accounts.length) throw new Error("The setup account already exists. No existing password was changed.");
  await root.execute("INSERT INTO ganesh_cms.admin_profiles (id,email,display_name,password_hash,role) VALUES (?,?,?,?,'administrator')", [randomUUID(), email, "Ganesh Administrator", await hashPassword(password)]);
  await writeFile(adminEnv, ["# Generated local-only MariaDB configuration. Do not commit.", "MYSQL_HOST=127.0.0.1", "MYSQL_PORT=3306", "MYSQL_DATABASE=ganesh_cms", "MYSQL_USER=ganesh_app", `MYSQL_PASSWORD=${dbPassword}`, "MYSQL_CONNECTION_LIMIT=10", "MYSQL_SSL=false", "ADMIN_SITE_ORIGIN=http://localhost:3001", `CMS_MEDIA_DIR=${path.join(adminRoot, "var", "media").replaceAll("\\", "/")}`, "CMS_MEDIA_ORIGIN=http://localhost:3001", "CMS_ALLOW_LOCAL_MEDIA=true", "PUBLIC_SITE_ORIGIN=http://localhost:3000", "PUBLIC_SITE_REVALIDATE_URL=http://localhost:3000/api/revalidate", `PUBLIC_SITE_REVALIDATE_SECRET=${sharedSecret}`, ""].join("\n"), { flag: "wx" });
  await writeFile(publicEnv, ["# Generated local-only CMS connection. No database credentials in the public app.", "CMS_PUBLIC_CONTENT_URL=http://localhost:3001/api/public-content", `PUBLIC_SITE_REVALIDATE_SECRET=${sharedSecret}`, "NEXT_PUBLIC_MEDIA_ORIGIN=http://localhost:3001", "CMS_ALLOW_LOCAL_MEDIA=true", ""].join("\n"), { flag: "wx" });
  await mkdir(path.join(adminRoot, ".local-setup"), { recursive: true });
  await writeFile(path.join(adminRoot, ".local-setup", "admin-access.txt"), `Local Ganesh Admin\nURL: http://localhost:3001/login\nEmail: ${email}\nTemporary password: ${password}\n\nChange this password in Settings > Account after first login, then delete this file.\n`, { flag: "wx" });
  console.log("MariaDB migrated and seeded. Both local environments configured with a restricted app database user.");
  console.log("Administrator access is in .local-setup/admin-access.txt (git-ignored). Change the temporary password after sign-in.");
} finally { await root.end(); }
