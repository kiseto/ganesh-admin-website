import { NextResponse } from "next/server";
import { getMySqlPool } from "@/lib/mysql/db";
import { getAdminUser, hashPassword, verifyPassword } from "@/lib/auth/session";
import { isSameOrigin, readJson } from "@/lib/auth/request";
import { z } from "zod";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 });
  const user = await getAdminUser();
  const pool = getMySqlPool();
  if (!pool) return NextResponse.json({ error: "CMS is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(255), currentPassword: z.string().min(1).max(256), newPassword: z.string().min(10).max(256) }).safeParse(await readJson(request, 4096).catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide valid account details and a new password of 10–256 characters." }, { status: 422 });
  const body = parsed.data;
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  if (!name || !email || !email.includes("@") || !body?.currentPassword || !body.newPassword || body.newPassword.length < 10) return NextResponse.json({ error: "Provide a valid name, email, current password, and a new password of at least 10 characters." }, { status: 422 });
  const connection = await pool.getConnection().catch(() => null);
  if (!connection) return NextResponse.json({ error: "MariaDB is unavailable." }, { status: 503 });
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT password_hash FROM admin_profiles WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [user.id]) as unknown as [Array<Record<string, unknown>>, unknown];
    const profile = rows[0];
    if (!profile || !(await verifyPassword(body.currentPassword, String(profile.password_hash)))) { await connection.rollback(); return NextResponse.json({ error: "The current password is incorrect." }, { status: 401 }); }
    const passwordHash = await hashPassword(body.newPassword);
    await connection.execute("UPDATE admin_profiles SET display_name = ?, email = ?, password_hash = ? WHERE id = ?", [name, email, passwordHash, user.id]);
    await connection.execute("DELETE FROM admin_sessions WHERE user_id = ?", [user.id]);
    await connection.execute("INSERT INTO audit_logs (actor, action, metadata) VALUES (?, 'account_updated', ?)", [user.id, JSON.stringify({ email })]);
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    const duplicate = error instanceof Error && /duplicate|unique/i.test(error.message);
    return NextResponse.json({ error: duplicate ? "That email address is already in use." : "Could not update the account." }, { status: duplicate ? 409 : 500 });
  } finally { connection.release(); }
}
