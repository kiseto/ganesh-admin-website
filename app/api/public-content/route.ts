import { NextResponse } from "next/server";
import { getPublishedContent } from "@/lib/content/store";

export const runtime = "nodejs";

export async function GET() {
  const content = await getPublishedContent();
  return NextResponse.json(content, { headers: { "cache-control": "no-store" } });
}
