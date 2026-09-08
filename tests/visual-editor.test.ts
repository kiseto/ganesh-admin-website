import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createEditorPreviewSession } from "../lib/preview-ticket.ts";
import { getAt, setAt } from "../lib/visual-editor.ts";
import { initialContent } from "../lib/content/seed.ts";

test("preview tickets are expiring, audience-bound, signed shells without draft content", () => {
  const previous = process.env.PUBLIC_SITE_REVALIDATE_SECRET;
  process.env.PUBLIC_SITE_REVALIDATE_SECRET = "unit-test-only-secret";
  try {
    const first = createEditorPreviewSession();
    const second = createEditorPreviewSession();
    assert.notEqual(first.token, second.token);
    const [payload, signature] = first.token.split(".");
    assert.equal(signature, createHmac("sha256", "unit-test-only-secret").update(payload).digest("base64url"));
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString());
    assert.equal(ticket.purpose, "ganesh-editor-shell");
    assert.equal(ticket.origin, first.origin);
    assert.ok(ticket.expiresAt > Date.now() && ticket.expiresAt <= Date.now() + 15 * 60 * 1000);
    assert.equal(ticket.content, undefined);
    delete process.env.PUBLIC_SITE_REVALIDATE_SECRET;
    assert.throws(createEditorPreviewSession, /matching public-site revalidation secret/);
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_SITE_REVALIDATE_SECRET;
    else process.env.PUBLIC_SITE_REVALIDATE_SECRET = previous;
  }
});

test("editing one product preserves every unrelated record, reference and media attribute", () => {
  const original = structuredClone(initialContent);
  original.products[0].active = false;
  original.products[0].image.focalPoint = "30% 70%";
  const next = setAt(original, "products.0.name", "Changed only this product");
  assert.equal(getAt(next, "products.0.name"), "Changed only this product");
  assert.equal(original.products[0].name, initialContent.products[0].name);
  assert.deepEqual(next.products[0].image, original.products[0].image);
  assert.equal(next.products[0].active, false);
  assert.deepEqual(next.products.slice(1), original.products.slice(1));
  assert.deepEqual({ ...next, products: undefined }, { ...original, products: undefined });
});
