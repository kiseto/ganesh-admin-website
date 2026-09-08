import { randomUUID } from "node:crypto";
import { scriptDatabase } from "./environment.ts";
import { hashPassword } from "../lib/auth/password.ts";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running create:admin.");
const passwordHash = await hashPassword(password);
const pool = scriptDatabase();
try {
  // Never resets an existing account or silently elevates its role.
  await pool.execute("INSERT INTO admin_profiles (id, email, display_name, password_hash, role) VALUES (?, ?, ?, ?, 'administrator')", [randomUUID(), email, process.env.ADMIN_DISPLAY_NAME || "Ganesh Administrator", passwordHash]);
  console.log(`Created administrator: ${email}`);
} finally { await pool.end(); }
