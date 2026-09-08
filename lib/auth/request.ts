/** Cookie-authenticated writes require an explicit same-origin browser request. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.ADMIN_SITE_ORIGIN || new URL(request.url).origin;
  return origin === expected && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function readJson(request: Request, maxBytes = 2 * 1024 * 1024): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Request body is too large.");
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } finally { await reader.cancel().catch(() => undefined); }
}
