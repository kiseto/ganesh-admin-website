import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/request";
import { requireAdmin } from "@/lib/auth/session";
import { createEditorPreviewSession } from "@/lib/preview-ticket";
export const runtime = "nodejs";
const headers = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" };
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Untrusted request origin." }, { status: 403, headers });
  if (!await requireAdmin()) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  try { return NextResponse.json(createEditorPreviewSession(), { headers }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Preview unavailable." }, { status: 503, headers }); }
}
export async function GET() {
  return NextResponse.json({ error: "Draft snapshots are never exposed by the preview API." }, { status: 405, headers });
}
