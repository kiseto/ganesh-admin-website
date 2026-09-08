import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "C:/Users/RL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const origin = "http://localhost:3001";
const access = await readFile(".local-setup/admin-access.txt", "utf8");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
async function request(path, method = "GET", data) {
  const response = await context.request.fetch(origin + path, { method, data, headers: { origin }, timeout: 60000 });
  const result = await response.json();
  assert.equal(response.ok(), true, JSON.stringify(result));
  return result;
}
let original, version, changed = false;
try {
  await request("/api/auth/login", "POST", { email: access.match(/^Email: (.+)$/m)[1], password: access.match(/^Temporary password: (.+)$/m)[1] });
  original = await request("/api/content"); version = original.version;
  assert.deepEqual(original.content, await request("/api/public-content"), "Existing private user draft found; test will not overwrite it.");
  const next = structuredClone(original.content);
  const bytes = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#C80418" } }).png().toBuffer();
  const uploaded = await context.request.post(origin + "/api/media", { headers: { origin }, multipart: { alt: "Temporary browser verification fabric", file: { name: "coverage.png", mimeType: "image/png", buffer: bytes } } });
  assert.equal(uploaded.ok(), true); const image = await uploaded.json();
  const ref = { src: image.src, assetId: image.assetId, alt: image.alt };
  next.fabrics[0].description = "Browser verified Aircool description."; next.fabrics[0].image = ref;
  const id = randomUUID(); next.fabrics.push({ ...next.fabrics[0], id, slug: id, name: "Browser verified fabric", order: next.fabrics.length });
  const pid = randomUUID(); next.products.push({ ...next.products[0], id: pid, slug: pid, name: "Browser verified product", image: ref, order: next.products.length });
  next.workCategories[0].tiles.push({ id: randomUUID(), title: "Browser verified work", description: "CMS portfolio image", image: ref, order: next.workCategories[0].tiles.length, active: true });
  next.global.quoteLabel = "Browser verified quote"; next.global.address = "Browser verified address";
  next.pages.products.nextHeading = "Browser verified catalog copy";
  next.pages.products.metaTitle = "Browser verified SEO";
  next.pages.customize.preparationIdeaTitle = "Browser verified preparation";
  next.editorial.images.customizeHero = ref;
  next.editorial.productionQuestions[0].answer = "Browser verified production answer";
  next.editorial.labels.help.sizeGuide = "Browser verified size guide";
  next.orderBuilder.defaultFabric = next.fabrics[1].name;
  next.orderBuilder.defaultQuantity = "75";
  const saved = await request("/api/content", "PUT", { content: next, version }); version = saved.version; changed = true;
  assert.deepEqual(await request("/api/public-content"), original.content);
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
  assert.equal(await page.getByRole("tab", { name: /Browser verified fabric/ }).count(), 0);
  assert.equal(await page.locator(".fabric-explorer__specimen-index").innerText(), "01 / 05");
  console.log("PASS: new content and media stay private in a saved draft.");
  const publication = await request("/api/content", "POST", { version }); assert.equal(publication.revalidated, true);
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  assert.equal(await page.locator(".fabric-explorer__specimen-index").innerText(), "01 / 06");
  assert.ok(await page.getByText("Browser verified Aircool description.", { exact: true }).count());
  assert.ok(await page.getByRole("heading", { name: "Browser verified product", exact: true }).count());
  assert.ok(await page.getByText("Browser verified work", { exact: true }).count());
  await page.getByRole("tab", { name: /Browser verified fabric/ }).click();
  assert.equal(await page.locator(".fabric-explorer__specimen-index").innerText(), "06 / 06");
  assert.ok(await page.locator(".fabric-explorer__specimen img").getAttribute("src").then((src) => src.includes(encodeURIComponent(image.assetId)) || src.includes(image.assetId)));
  console.log("PASS: published added fabric/product/work render; six-fabric selector and image work.");
  for (const route of ["/products", "/our-work", "/production", "/customize"]) {
    await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle", timeout: 60000 });
    assert.ok(await page.getByText("Browser verified quote", { exact: true }).count());
    assert.ok(await page.locator(".site-footer__details").getByText("Browser verified address", { exact: true }).count());
    if (route === "/products") { assert.equal(await page.title(), "Browser verified SEO"); assert.ok(await page.getByRole("heading", { name: "Browser verified catalog copy" }).count()); }
    if (route === "/production") assert.ok(await page.getByText("Browser verified production answer", { exact: true }).count());
    if (route === "/customize") {
      assert.ok(await page.getByRole("heading", { name: "Browser verified preparation" }).count());
      assert.ok(await page.getByRole("heading", { name: "Browser verified size guide" }).count());
      assert.equal(await page.locator('input[name="quantity"]').inputValue(), "75");
      assert.equal(await page.locator('input[name="fabric"]:checked').inputValue(), next.fabrics[1].name);
      assert.ok((await page.locator(".customize-hero__image img").getAttribute("src")).includes(image.assetId));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: all interior headers/footers, secondary copy, metadata, image and builder defaults use the publication.");
  await writeFile(".local-setup/content-coverage-results.json", JSON.stringify({ passed: true, errors, checked: ["private draft", "media replacement", "fabric count and selection", "product/work additions", "interior header/footer", "page copy/SEO", "production FAQ", "builder defaults"] }, null, 2));
} finally {
  try {
    if (changed) {
      const restored = await request("/api/content", "PUT", { content: original.content, version });
      const publication = await request("/api/content", "POST", { version: restored.version });
      assert.equal(publication.revalidated, true);
      assert.deepEqual(await request("/api/public-content"), original.content);
      console.log("Restored original content and refreshed public pages. Audit revisions/media retained.");
    }
  } finally { await browser.close(); }
}
