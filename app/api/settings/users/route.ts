import { getAdminUser } from "@/lib/auth/session";
import { isSameOrigin, readJson } from "@/lib/auth/request";
import { getMySqlPool, type DbRow } from "@/lib/mysql/db";
import { createTeamUser, changeTeamUserRole, TeamError } from "@/lib/auth/team-store";
export const runtime = "nodejs";

export async function GET() {
  const actor = await getAdminUser();
  if (!actor) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!actor.permissions.manageUsers) return Response.json({ error: "Only administrators can manage accounts and roles." }, { status: 403 });
  const pool = getMySqlPool();
  if (!pool) return Response.json({ error: "CMS is not configured." }, { status: 503 });
  try {
    const [users] = await pool.execute("SELECT id, display_name AS name, email, role FROM admin_profiles WHERE deleted_at IS NULL ORDER BY display_name, email") as unknown as [DbRow[], unknown];
    const [rows] = await pool.execute("SELECT id, name, can_publish, is_system, version FROM admin_roles ORDER BY is_system DESC, name") as unknown as [DbRow[], unknown];
    return Response.json({ users, roles: rows.map((r) => ({ id: r.id, name: r.name, canPublish: Number(r.can_publish) === 1, isSystem: Number(r.is_system) === 1, version: Number(r.version) })), currentUserId: actor.id }, { headers: { "cache-control": "private, no-store" } });
  } catch { return Response.json({ error: "Cannot load accounts. Check MariaDB and apply the users/roles migration." }, { status: 503 }); }
}
async function write(request: Request, update: boolean) {
  if (!isSameOrigin(request)) return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  const actor = await getAdminUser();
  if (!actor) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!actor.permissions.manageUsers) return Response.json({ error: "Only administrators can manage accounts and roles." }, { status: 403 });
  const pool = getMySqlPool();
  if (!pool) return Response.json({ error: "CMS is not configured." }, { status: 503 });
  try {
    const input = await readJson(request, 8192).catch(() => null);
    const result = await (update ? changeTeamUserRole(pool, actor.id, input) : createTeamUser(pool, actor.id, input));
    return Response.json({ ok: true, ...result }, { status: update ? 200 : 201 });
  } catch (error) { return Response.json({ error: error instanceof TeamError ? error.message : "Could not save the account. Please try again." }, { status: error instanceof TeamError ? error.status : 503 }); }
}
export async function POST(request: Request) { return write(request, false); }
export async function PATCH(request: Request) { return write(request, true); }
