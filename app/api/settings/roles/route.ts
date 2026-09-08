import { getAdminUser } from "@/lib/auth/session";
import { isSameOrigin, readJson } from "@/lib/auth/request";
import { getMySqlPool } from "@/lib/mysql/db";
import { saveTeamRole, TeamError } from "@/lib/auth/team-store";
export const runtime = "nodejs";
async function write(request: Request, update: boolean) {
  if (!isSameOrigin(request)) return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  const actor = await getAdminUser();
  if (!actor) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!actor.permissions.manageUsers) return Response.json({ error: "Only administrators can manage accounts and roles." }, { status: 403 });
  const pool = getMySqlPool();
  if (!pool) return Response.json({ error: "CMS is not configured." }, { status: 503 });
  try {
    const result = await saveTeamRole(pool, actor.id, await readJson(request, 4096).catch(() => null), update);
    return Response.json({ ok: true, ...result }, { status: update ? 200 : 201 });
  } catch (error) { return Response.json({ error: error instanceof TeamError ? error.message : "Could not save the role. Please try again." }, { status: error instanceof TeamError ? error.status : 503 }); }
}
export async function POST(request: Request) { return write(request, false); }
export async function PATCH(request: Request) { return write(request, true); }
