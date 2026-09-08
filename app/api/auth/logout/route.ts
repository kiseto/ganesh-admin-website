import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/auth/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 });
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
