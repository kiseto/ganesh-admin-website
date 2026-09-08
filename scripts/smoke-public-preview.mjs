import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "C:/Users/RL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const results = [], errors = [];
const pass = (message) => { results.push(message); console.log("PASS:", message); };
await mkdir(".visual-qa/visual-editor", { recursive: true });
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  for (const [url, method, status] of [
    ["http://localhost:3001/api/content", "get", 401],
    ["http://localhost:3001/api/editor-preview", "post", 401],
    ["http://localhost:3001/api/editor-preview?token=anything", "get", 405],
    ["http://localhost:3000/editor-preview", "get", 404],
    ["http://localhost:3000/editor-preview?token=invalid", "get", 404],
  ]) {
    const response = await context.request[method](url, { headers: { origin: "http://localhost:3001", "x-editor-preview-origin": "http://localhost:3000" } });
    assert.equal(response.status(), status, `${method} ${url}`);
  }
  pass("Anonymous drafts and preview creation denied; missing/forged preview tickets rejected; no snapshot GET API");
  const content = await (await context.request.get("http://localhost:3001/api/public-content")).json();
  for (const width of [1440, 768, 390]) {
    const page = await context.newPage(); await page.setViewportSize({ width, height: 900 });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of ["/", "/products", "/customize", "/our-work", "/production"]) {
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 120000 });
      assert.equal(response.status(), 200);
      await page.locator("h1").waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflows at ${width}`);
      await page.screenshot({ path: `.visual-qa/visual-editor/public-${route.slice(1) || "home"}-${width}.png`, animations: "disabled" });
      if (route === "/products") {
        for (const product of content.products.filter((item) => item.active)) {
          const trigger = page.locator(`[data-editor-product-id="${product.id}"] button[aria-haspopup="dialog"]`);
          await trigger.click();
          const dialog = page.locator(".product-quick-view[open]"); await dialog.waitFor();
          assert.equal(await dialog.locator("h3").innerText(), product.name);
          assert.ok((await dialog.innerText()).includes(product.details));
          assert.equal(await dialog.locator("img").getAttribute("alt"), product.image.alt);
          assert.ok(await page.evaluate(() => document.documentElement.classList.contains("product-quick-view-open")));
          await page.keyboard.press("Shift+Tab");
          assert.ok(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]")), `Focus escaped modal at ${width}px for ${product.id}: ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 200))}`);
          await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
          assert.ok(await trigger.evaluate((el) => el === document.activeElement), "Focus not restored to product trigger");
          await page.waitForFunction(() => !document.documentElement.classList.contains("product-quick-view-open"));
        }
        const tabs = page.locator('[id^="fabric-explorer-tab-"]');
        await tabs.nth(1).click(); await page.keyboard.press("ArrowRight");
        assert.equal(await tabs.nth(2).getAttribute("aria-selected"), "true");
      }
      if (route === "/production") {
        const buttons = page.locator(".production-questions__faq-button");
        await buttons.nth(1).click(); assert.equal(await buttons.nth(1).getAttribute("aria-expanded"), "true");
        assert.equal(await page.locator(".production-stage").count(), content.productionSteps.filter((s) => s.active).length);
      }
      if (route === "/customize") {
        const radios = page.locator('input[type="radio"]'); await page.locator('label:has(input[type="radio"])').nth(1).click(); assert.ok(await radios.nth(1).isChecked());
        const sizes = page.locator('[role="tab"]').filter({ hasText: "Adult" });
        if (await sizes.count()) { await sizes.first().click(); assert.equal(await sizes.first().getAttribute("aria-selected"), "true"); }
        const faq = page.locator(".helpful-before-ordering__faq-button").nth(1);
        await faq.click(); assert.equal(await faq.getAttribute("aria-expanded"), "true");
      }
    }
    pass(`${width}px: all five public routes, every product modal, focus/Escape/scroll lock, fabric keyboard tabs, builder, size tabs and FAQs`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(".visual-qa/visual-editor/public-results.json", JSON.stringify({ results, errors }, null, 2));
}




