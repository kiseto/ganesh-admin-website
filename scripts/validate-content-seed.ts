import { initialContent } from "../lib/content/seed.ts";
import { parseContentSnapshot } from "../lib/content/schema.ts";

const parsed = parseContentSnapshot(initialContent);
if (parsed.schemaVersion !== 1) throw new Error("Unexpected content schema version");
if (parsed.products.length !== 8 || parsed.fabrics.length !== 5 || parsed.productionSteps.length !== 8 || parsed.workCategories.length !== 5) throw new Error("Seed collection counts do not match the public source content");
if (parsed.products.some((item) => !item.slug || !item.image.alt) || parsed.fabrics.some((item) => !item.slug || !item.image.alt)) throw new Error("Content images must include alt text and slugs");
console.log(`Validated schema v${parsed.schemaVersion}: ${parsed.products.length} products, ${parsed.fabrics.length} fabrics, ${parsed.workCategories.length} work categories.`);
