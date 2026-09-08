import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const admin = "http://localhost:3001";
const access = await readFile(".local-setup/admin-access.txt", "utf8");
const email = access.match(/^Email: (.+)$/m)?.[1];
const password = access.match(/^Temporary password: (.+)$/m)?.[1];
let cookie = "";
const results = [];
async function call(route, { method = "GET", body, authenticated = true, origin = admin } = {}) {
  const headers = { origin, ...(authenticated && cookie ? { cookie } : {}) };
  if (body && !(body instanceof FormData)) headers["content-type"] = "application/json";
  const response = await fetch(admin + route, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, redirect: "manual", signal: AbortSignal.timeout(60000) });
  const data = await response.json().catch(() => null);
  return { response, data };
}
function record(name) { results.push(name); console.log("PASS:", name); }
for (const path of ["/api/content", "/api/auth/me"]) { assert.equal((await call(path, { authenticated: false })).response.status, 401); }
assert.equal((await call("/api/media", { method: "POST", authenticated: false })).response.status, 401);
record("unauthenticated draft/media/profile routes are protected");
assert.equal((await call("/api/auth/login", { method: "POST", body: { email: {}, password: [] } })).response.status, 422);
assert.equal((await call("/api/auth/login", { method: "POST", body: { email, password: "incorrect password" } })).response.status, 401);
const login = await call("/api/auth/login", { method: "POST", body: { email, password, remember: false } });
assert.equal(login.response.status, 200, JSON.stringify(login.data));
assert.match(login.response.headers.get("set-cookie"), /HttpOnly/i);
cookie = login.response.headers.get("set-cookie").split(";")[0];
record("real MariaDB login, invalid credentials and HTTP-only session cookie");
assert.equal((await call("/api/content", { method: "PUT", origin: "https://evil.example", body: { version: 1, content: {} } })).response.status, 403);
record("cross-origin writes are blocked");
const original = (await call("/api/content")).data;
assert.ok(original?.content);
const publication = (await call("/api/public-content", { authenticated: false })).data;
assert.deepEqual(original.content, publication, "Smoke test requires matching initial draft/publication; it will not overwrite user drafts.");
await writeFile(".local-setup/smoke-original.json", JSON.stringify(original, null, 2));
let expectedVersion = original.version;
let changed = false;
let published = false;
try {
  const invalid = structuredClone(original.content); invalid.products.shift();
  assert.equal((await call("/api/content", { method: "PUT", body: { content: invalid, version: expectedVersion } })).response.status, 422);
  record("broken product references are rejected");
  const png = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#a73035" } }).png().toBuffer();
  const bad = new FormData(); bad.append("file", new Blob(["not png"], { type: "image/png" }), "bad.png"); bad.append("alt", "Invalid test file");
  assert.equal((await call("/api/media", { method: "POST", body: bad })).response.status, 415);
  const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "cms-smoke.png"); form.append("alt", "Temporary CMS integration-test swatch");
  const uploaded = await call("/api/media", { method: "POST", body: form });
  assert.equal(uploaded.response.status, 200, JSON.stringify(uploaded.data));
  assert.equal((await fetch(uploaded.data.src)).status, 404);
  assert.equal((await fetch(uploaded.data.src, { headers: { cookie } })).status, 200);
  record("validated upload persists and draft media stays private");
  const content = structuredClone(original.content);
  content.pages.home.hero.eyebrow = "CMS smoke test — private until published";
  const image = { src: uploaded.data.src, assetId: uploaded.data.assetId, alt: "Temporary CMS integration-test swatch" };
  content.fabrics[0].description = "Temporary Aircool smoke-test description.";
  content.fabrics[0].image = image;
  const fabricId = randomUUID(); content.fabrics.push({ ...content.fabrics[0], id: fabricId, slug: fabricId, name: "CMS test fabric", order: content.fabrics.length });
  const productId = randomUUID(); content.products.push({ ...content.products[0], id: productId, slug: productId, name: "CMS test product", image, order: content.products.length });
  content.workCategories[0].tiles.push({ id: randomUUID(), title: "CMS test work", description: "Temporary verification image", image, active: true, order: content.workCategories[0].tiles.length });
  const saved = await call("/api/content", { method: "PUT", body: { content, version: expectedVersion } });
  assert.equal(saved.response.status, 200, JSON.stringify(saved.data)); expectedVersion = saved.data.version; changed = true;
  assert.deepEqual((await call("/api/public-content", { authenticated: false })).data, publication);
  const htmlBefore = await (await fetch("http://localhost:3000", { signal: AbortSignal.timeout(60000) })).text();
  assert.ok(!htmlBefore.includes("CMS smoke test"));
  record("draft edits and additions persist without changing the public website");
  assert.equal((await call("/api/content", { method: "PUT", body: { content, version: original.version } })).response.status, 409);
  assert.equal((await call("/api/content", { method: "POST", body: { version: original.version } })).response.status, 409);
  record("stale draft saves and publication attempts conflict safely");
  const live = await call("/api/content", { method: "POST", body: { version: expectedVersion } });
  assert.equal(live.response.status, 200, JSON.stringify(live.data)); published = true;
  assert.equal(live.data.revalidated, true, "Public revalidation failed");
  assert.deepEqual((await call("/api/public-content", { authenticated: false })).data, content);
  const html = await (await fetch("http://localhost:3000", { signal: AbortSignal.timeout(60000) })).text();
  for (const marker of ["CMS smoke test", "CMS test fabric", "CMS test product", "CMS test work"]) assert.ok(html.includes(marker), `Missing published ${marker}`);
  assert.equal((await fetch(image.src)).status, 200);
  assert.equal((await call("/api/content/revalidate", { method: "POST" })).response.status, 200);
  assert.equal((await fetch("http://localhost:3000/api/revalidate", { method: "POST" })).status, 401);
  record("publication updates public text, images and new collections with immediate revalidation");
} finally {
  if (changed) {
    const restored = await call("/api/content", { method: "PUT", body: { content: original.content, version: expectedVersion } });
    assert.equal(restored.response.status, 200, "Concurrent edits detected: original saved in .local-setup/smoke-original.json; no forced restore.");
    if (published) {
      const live = await call("/api/content", { method: "POST", body: { version: restored.data.version } });
      assert.equal(live.response.status, 200); assert.equal(live.data.revalidated, true);
    }
    record("original public content restored; test revisions and retained media remain auditable");
  }
  await writeFile(".local-setup/smoke-results.json", JSON.stringify(results, null, 2));
}
assert.equal((await call("/api/auth/logout", { method: "POST" })).response.status, 200);
assert.equal((await call("/api/content")).response.status, 401);
record("logout revokes the database session");
