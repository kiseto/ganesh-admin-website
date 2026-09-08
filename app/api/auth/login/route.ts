import { createHash } from "node:crypto";
import { z } from "zod";
import { getMySqlPool, type DbRow } from "@/lib/mysql/db";
import { createAdminSession, verifyPassword } from "@/lib/auth/session";
import { isSameOrigin, readJson } from "@/lib/auth/request";
export const runtime = "nodejs";
const login = z.object({ email: z.string().trim().toLowerCase().email().max(255), password: z.string().min(1).max(256), remember: z.boolean().optional() });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  const parsed = login.safeParse(await readJson(request, 4096).catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email and password." }, { status: 422 });
  const pool = getMySqlPool();
  if (!pool) return Response.json({ error: "MariaDB is not configured." }, { status: 503 });
  const { email, password, remember } = parsed.data;
  const bucket = createHash("sha256").update(email).digest("hex");
  try {
    // Atomic shared counters work across processes and survive app restarts.
    await pool.execute("INSERT INTO auth_login_attempts (bucket, attempts) VALUES (?, 1) ON DUPLICATE KEY UPDATE attempts = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, 1, attempts + 1), window_started_at = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, UTC_TIMESTAMP(6), window_started_at)", [bucket]);
    const [attempts] = await pool.execute("SELECT attempts FROM auth_login_attempts WHERE bucket = ?", [bucket]) as unknown as [DbRow[], unknown];
    if (Number(attempts[0]?.attempts) > 10) return Response.json({ error: "Too many sign-in attempts. Wait 15 minutes and try again." }, { status: 429, headers: { "retry-after": "900" } });
    const [rows] = await pool.execute("SELECT p.id, p.password_hash FROM admin_profiles p JOIN admin_roles r ON r.id = p.role WHERE p.email = ? AND p.deleted_at IS NULL LIMIT 1", [email]) as unknown as [DbRow[], unknown];
    const profile = rows[0];
    // Do equivalent password work for unknown accounts; no account-existence disclosure.
    const dummy = "scrypt$" + "0".repeat(32) + "$" + "0".repeat(128);
    const valid = await verifyPassword(password, profile ? String(profile.password_hash) : dummy);
    if (!profile || !valid) return Response.json({ error: "Those credentials were not recognized." }, { status: 401 });
    await createAdminSession(String(profile.id), remember === true);
    await pool.execute("DELETE FROM auth_login_attempts WHERE bucket = ?", [bucket]);
    await pool.execute("DELETE FROM admin_sessions WHERE expires_at <= UTC_TIMESTAMP()");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Cannot reach the MariaDB CMS. Check that XAMPP MariaDB is running and migrations are applied." }, { status: 503 });
  }
}
