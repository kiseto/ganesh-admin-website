import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "C:/Users/RL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: "no-preference" });
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
    await page.locator("h1").waitFor({ state: "visible" });
    assert.equal(await page.locator("[data-thread-origin]").count(), 1);
    assert.equal(await page.locator("[data-thread-target]").count(), 1);
    assert.equal(await page.locator(".scroll-thread-journey__path").count(), 2);
    if (width === 390) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      assert.equal(await page.locator("#mobile-navigation").isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#mobile-navigation").isVisible(), false);
    }
    const trigger = page.locator('.product-showcase__group:not([aria-hidden="true"]) button').first();
    await page.locator("#products").scrollIntoViewIfNeeded();
    await trigger.click({ timeout: 30000 });
    await page.locator("dialog[open]").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.locator("dialog[open]").waitFor({ state: "detached" });
    const fabricTabs = page.locator('[id^="fabric-explorer-tab-"]');
    await page.locator("#fabrics").scrollIntoViewIfNeeded();
    await fabricTabs.nth(1).click();
    assert.equal(await fabricTabs.nth(1).getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowRight");
    assert.equal(await fabricTabs.nth(2).getAttribute("aria-selected"), "true");
    const faq = page.locator(".helpful-before-ordering__faq-button").nth(1);
    await page.locator("#help").scrollIntoViewIfNeeded();
    await faq.click();
    assert.equal(await faq.getAttribute("aria-expanded"), "true");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    results.push({ width, passed: true, errors });
    console.log(`PASS: ${width}px normal-motion menu, product dialog, fabric keyboard tabs and FAQ.`);
    await page.close();
  }
  await writeFile(".local-setup/motion-smoke-results.json", JSON.stringify(results, null, 2));
} finally { await browser.close(); }
