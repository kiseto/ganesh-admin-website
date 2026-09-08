import { writeFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { initialContent } from "../lib/content/seed.ts";
import { parseContentSnapshot, type ContentSnapshot } from "../lib/content/schema.ts";

const publicRoot = path.resolve(process.env.PUBLIC_REPO_PATH || "../ganesh-website");
const read = (name: string) => import(pathToFileURL(path.join(publicRoot, "data", `${name}.ts`)).href);
const [productData, catalog, fabricData, productionData, workData, stories] = await Promise.all(["products", "catalog", "fabrics", "production", "work", "work-stories"].map(read));
const content = structuredClone(initialContent);
type SourceProduct = { id: string; name: string; description: string; image: string; alt: string; category: string; fabric: string; bestFor: string; customization: string; orderBuilderProduct?: string };
type SourceFabric = { id: string; name: string; description: string; image: string; alt: string; qualities: string[] };
type SourceWork = { id: string; label: string; leadDescription: string; tiles: { title: string; description: string; image: string; alt: string; focalPoint?: string }[] };
content.products = productData.products.map((item: SourceProduct, order: number) => ({ id: item.id, slug: item.id, name: item.name, shortDescription: item.description, ...catalog.productDetails[item.id], category: item.category, fabric: item.fabric, bestFor: item.bestFor, customization: item.customization, orderBuilderProduct: item.orderBuilderProduct, image: { src: item.image, alt: item.alt }, order, active: true }));
content.fabrics = fabricData.fabrics.map((item: SourceFabric, order: number) => ({ id: item.id, slug: item.id, name: item.name, description: item.description, qualities: [...item.qualities], image: { src: item.image, alt: item.alt }, order, active: true }));
content.productionSteps = productionData.productionSteps.map((item: ContentSnapshot["productionSteps"][number], order: number) => ({ ...item, slug: item.id, order, active: true }));
content.workCategories = workData.categories.map((category: SourceWork, order: number) => {
  const story = stories.workStories[category.id];
  return { id: category.id, slug: category.id, label: category.label, leadDescription: category.leadDescription, story: { heading: story.heading, description: story.description, focus: story.focus, brief: story.brief, relatedProductIds: story.products.map((product: { id: string }) => product.id) }, tiles: category.tiles.map((tile, tileOrder) => ({ id: `${category.id}-${String(tileOrder + 1).padStart(2, "0")}`, title: tile.title, description: tile.description, image: { src: tile.image, alt: tile.alt, ...(tile.focalPoint ? { focalPoint: tile.focalPoint } : {}) }, order: tileOrder, active: true })), order, active: true };
});
// Embedded section/page copy stays a reviewed structured fixture, never the admin preview.
// Verify the hero image and structured animated words still occur in the public component.
const heroSource = await readFile(path.join(publicRoot, "components/sections/HeroHeader.tsx"), "utf8");
for (const value of [content.pages.home.hero.image.src, content.pages.home.hero.headlineEmphasis]) if (!heroSource.includes(value)) throw new Error(`Public hero changed: review ${value} before regenerating the seed.`);
await writeFile("lib/content/initial-content.json", JSON.stringify(parseContentSnapshot(content), null, 2) + "\n");
console.log("Generated validated fixture from six public data sources; retained reviewed embedded section copy.");
