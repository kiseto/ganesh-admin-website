import { readFile } from "node:fs/promises";
import path from "node:path";
import { getMySqlPool, type DbRow } from "@/lib/mysql/db";
import { getAdminUser } from "@/lib/auth/session";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(filename)) return new Response(null, { status: 404 });
  const pool = getMySqlPool();
  if (!pool) return new Response(null, { status: 503 });
  try {
    const [rows] = await pool.execute("SELECT a.mime_type, p.asset_id AS published FROM media_assets a LEFT JOIN media_publications p ON p.asset_id = a.id WHERE a.storage_path = ? AND a.deleted_at IS NULL", [`content/${filename}`]) as unknown as [DbRow[], unknown];
    const asset = rows[0];
    if (!asset || (!asset.published && !await getAdminUser())) return new Response(null, { status: 404 });
    const bytes = await readFile(path.join(path.resolve(/* turbopackIgnore: true */ process.env.CMS_MEDIA_DIR || "var/media"), "content", filename));
    return new Response(bytes, { headers: { "content-type": String(asset.mime_type), "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "cache-control": asset.published ? "public, max-age=31536000, immutable" : "private, no-store" } });
  } catch { return new Response(null, { status: 503 }); }
}
