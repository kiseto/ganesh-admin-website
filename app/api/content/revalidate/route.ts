import { requireAdmin } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/auth/request";
import { notifyPublicRevalidation } from "@/lib/content/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!user.permissions.publish) return Response.json({ error: "Your role cannot refresh public content." }, { status: 403 });
  const ok = await notifyPublicRevalidation();
  return Response.json({ ok }, { status: ok ? 200 : 502 });
}
