import { createHash, randomBytes } from "node:crypto";
export { hashPassword, verifyPassword } from "./password";
import { cookies } from "next/headers";
import { getMySqlPool, type DbRow } from "@/lib/mysql/db";
import { permissionsForRole } from "./roles";

const COOKIE = "ganesh_admin_session";
const SESSION_DAYS = 30;

export type AdminUser = { id: string; email: string; displayName: string; role: string; roleName: string; permissions: { manageUsers: boolean; publish: boolean } };

function hashSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const pool = getMySqlPool();
  if (!pool) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  let rows: DbRow[];
  try {
    [rows] = await pool.execute(
      `SELECT p.id, p.email, p.display_name, p.role, r.name AS role_name, r.can_publish
         FROM admin_sessions s
         JOIN admin_profiles p ON p.id = s.user_id
         JOIN admin_roles r ON r.id = p.role
        WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND p.deleted_at IS NULL
        LIMIT 1`,
      [hashSession(token)],
    ) as unknown as [DbRow[], unknown];
  } catch {
    return null;
  }
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name || "Admin User"),
    role: String(row.role),
    roleName: String(row.role_name),
    permissions: permissionsForRole(String(row.role), Number(row.can_publish) === 1),
  };
}

export async function requireAdmin() {
  const user = await getAdminUser();
  return user;
}

export async function createAdminSession(userId: string, remember = true) {
  const pool = getMySqlPool();
  if (!pool) return false;
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + (remember ? SESSION_DAYS : 1) * 24 * 60 * 60 * 1000);
  await pool.execute(
    "INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    [hashSession(token), userId, expires],
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return true;
}

export async function destroyAdminSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  const pool = getMySqlPool();
  if (token && pool) await pool.execute("DELETE FROM admin_sessions WHERE token_hash = ?", [hashSession(token)]).catch(() => undefined);
  (await cookies()).set(COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export { COOKIE as ADMIN_SESSION_COOKIE };
