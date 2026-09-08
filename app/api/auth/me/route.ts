import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json(user, { headers: { "cache-control": "private, no-store" } });
}
