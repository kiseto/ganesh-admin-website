import { createHmac, randomUUID } from "node:crypto";

// Stateless, domain-separated tickets grant access to an empty preview shell.
// Drafts are delivered only from the authenticated editor to its own iframe.
export function createEditorPreviewSession() {
  const secret = process.env.PUBLIC_SITE_REVALIDATE_SECRET;
  if (!secret) throw new Error("Configure the matching public-site revalidation secret in both apps to enable private previews.");
  const origin = new URL(process.env.PUBLIC_SITE_ORIGIN ?? "http://localhost:3000").origin;
  const parentOrigin = new URL(process.env.ADMIN_SITE_ORIGIN ?? "http://localhost:3001").origin;
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ purpose: "ganesh-editor-shell", origin, parentOrigin, expiresAt, nonce: randomUUID() })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, expiresAt, origin };
}
