import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createEditorPreviewSession } from "../lib/preview-ticket.ts";
import { getAt, setAt, pageTargets, pages } from "../lib/visual-editor.ts";
import { editorFieldEntries, fieldLabel, isHiddenEditorField } from "../lib/editor-fields.ts";
import { contentSnapshotSchema } from "../lib/content/schema.ts";
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

test("destination controls are hidden recursively while button text and heading copy remain editable", () => {
  for (const name of ["href", "external", "slug", "target", "linkDestination", "url", "route", "path", "anchor", "externalUrl", "buttonHref", "maps", "facebook", "source", "orderBuilderProduct"]) {
    assert.equal(isHiddenEditorField(name), true, name);
  }
  for (const name of ["label", "link", "headlineTarget", "phone", "email", "image", "helpLink", "fabricLink"]) {
    assert.equal(isHiddenEditorField(name), false, name);
    assert.doesNotMatch(fieldLabel(name), /\b(href|route|path|anchor|slug|target|external URL)\b/i);
  }
  assert.deepEqual(editorFieldEntries(initialContent.pages.home.hero.primary).map(([key]) => key), ["label"]);
});

test("text edits retain every saved destination and identifier through schema validation and serialization", () => {
  const original = structuredClone(initialContent);
  original.global.nav[0].external = true;
  original.global.nav[0].href = "https://example.com/collection#featured";
  original.pages.home.hero.primary.href = "/products#school-uniform-set";
  function editVisible(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(editVisible);
    if (!value || typeof value !== "object") return value;
    const result = { ...value } as Record<string, unknown>;
    for (const [key, entry] of editorFieldEntries(result)) {
      result[key] = ["label", "headlineTarget", "link"].includes(key) && typeof entry === "string" ? `${entry} edited` : editVisible(entry);
    }
    return result;
  }
  function internalValues(value: unknown, prefix = ""): Record<string, unknown> {
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => isHiddenEditorField(key) ? [[`${prefix}${key}`, entry]] : Object.entries(internalValues(entry, `${prefix}${key}.`))));
  }
  const edited = contentSnapshotSchema.parse(editVisible(original));
  const saved = contentSnapshotSchema.parse(JSON.parse(JSON.stringify(edited)));
  const published = contentSnapshotSchema.parse(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(internalValues(published), internalValues(original));
  assert.notEqual(published.global.nav[0].label, original.global.nav[0].label);
  assert.notEqual(published.pages.home.hero.primary.label, original.pages.home.hero.primary.label);
});

test("page sections begin with navigation, end with footer and search, and separate interior content", () => {
  for (const page of Object.keys(pages) as (keyof typeof pages)[]) {
    const sections = pageTargets(page);
    assert.equal(sections[0].id, "header");
    assert.equal(sections.at(-2)?.id, "footer");
    assert.equal(sections.at(-1)?.id, "seo");
    const paths = sections.flatMap((section) => section.paths);
    assert.ok(!paths.includes("global"));
    if (page !== "home") {
      assert.ok(!paths.includes(`pages.${page}`));
      for (const key of Object.keys(initialContent.pages[page]!)) assert.ok(paths.includes(`pages.${page}.${key}`), `${page}.${key} is still reachable`);
    }
    for (const section of sections.slice(0, -1)) assert.ok(section.paths.every((path) => !/seo|metaTitle|metaDescription/.test(path)));
  }
  assert.deepEqual(editorFieldEntries({ image: {}, legal: "", seo: {}, secondary: {}, copy: "", primary: {} }).map(([key]) => key), ["copy", "secondary", "primary", "image", "legal", "seo"]);
});
