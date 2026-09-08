import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "C:/Users/RL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const label = process.argv[2] || "before";
if (!/^[a-z-]+$/.test(label)) throw new Error("Invalid capture label.");
await mkdir(`.visual-qa/${label}`, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const report = [];
try {
  for (const [device, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of ["/", "/products", "/our-work", "/production", "/customize"]) {
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const name = route === "/" ? "home" : route.slice(1);
      await page.screenshot({ path: `.visual-qa/${label}/${name}-${device}.png`, animations: "disabled" });
      const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.title, heading: document.querySelector("h1")?.textContent, images: [...document.images].filter((img) => img.getBoundingClientRect().top < innerHeight && !img.complete).length }));
      report.push({ device, route, status: response.status(), ...metrics, errors: [...errors] });
      console.log(`${label}: ${name} ${device} HTTP ${response.status()} overflow ${metrics.scrollWidth > width}`);
    }
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`.visual-qa/${label}/report.json`, JSON.stringify(report, null, 2));
