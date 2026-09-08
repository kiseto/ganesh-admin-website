import type { ContentSnapshot } from "./content/schema";
export type PageId = "home" | "products" | "customize" | "ourWork" | "production";
export const pages: Record<PageId, { label: string; route: string }> = {
  home: { label: "Home", route: "/" }, products: { label: "Products", route: "/products" },
  customize: { label: "Customize", route: "/customize" }, ourWork: { label: "Our Work / Artwork", route: "/our-work" },
  production: { label: "Production", route: "/production" },
};
export type EditorTarget = { id: string; label: string; selector: string; paths: string[] };
const target = (id: string, label: string, selector: string, ...paths: string[]): EditorTarget => ({ id, label, selector, paths });
const footer = target("footer", "Contact / Footer", "footer", "pages.home.footer", "global");
const fabrics = target("fabrics", "Fabrics", "#fabrics", "pages.home.fabrics", "fabrics", "editorial.labels.sections");
const order = target("order", "Order Builder", "#customize", "pages.home.order", "orderBuilder", "editorial.labels.builder");
const help = target("help", "Size Guide / FAQ", "#help", "pages.home.help", "sizeGuides", "faqs", "editorial.labels.help");
export function pageTargets(page: PageId): EditorTarget[] {
  if (page === "home") return [
    target("hero", "Hero", "#home", "pages.home.hero", "global"),
    target("brand", "Brand Statement", ".brand-statement", "pages.home.brandStatement"),
    target("products", "Products / View Product Modal", "#products", "pages.home.whatWeMake", "products", "editorial.labels.productDialog"),
    fabrics, target("production", "Production", "#production", "pages.home.production", "productionSteps"),
    target("work", "Our Work", "#work", "pages.home.work", "workCategories"), order,
    target("values", "Values", "#why", "pages.home.values", "brandValues"), help, footer,
  ];
  const hero = target("hero", "Page Hero / Copy", ".interior-hero", `pages.${page}`, ...(page === "customize" || page === "production" ? [`editorial.images.${page}Hero`] : []));
  if (page === "products") return [hero, target("products", "Product Catalog / Modal Content", "#catalog", "products", "editorial.labels.productDialog"), fabrics, target("cta", "Product CTA", "#products-cta", "pages.products"), footer];
  if (page === "customize") return [hero, order, target("product-options", "Product Options", "#order-product-heading", "products"), target("fabric-options", "Fabric Options", "#order-material-heading", "fabrics"), target("options", "Customization / Sizing Options", "#order-details-heading", "orderBuilder"), help, footer];
  if (page === "ourWork") return [hero, target("stories", "Categories / Stories / Gallery", "#work-stories", "workCategories"), footer];
  return [hero, target("steps", "Process Steps", "#journey", "productionSteps"), target("preparation", "Preparation Content", "#before-production", "editorial.productionPreparation"), target("questions", "Questions / FAQ", "#production-questions", "editorial.productionQuestions"), footer];
}
export function editorTargets(page: PageId, content: ContentSnapshot): EditorTarget[] {
  const result = [...pageTargets(page)];
  if (page === "home" || page === "products") content.products.forEach((item, index) => result.push(target(`product:${item.id}`, `Edit product · ${item.name}`, `[data-editor-product-id="${CSS.escape(item.id)}"]`, `products.${index}`)));
  if (["home", "products"].includes(page)) content.fabrics.forEach((item, index) => result.push(target(`fabric:${item.id}`, `Fabric · ${item.name}`, `#fabric-explorer-panel[aria-labelledby="fabric-explorer-tab-${CSS.escape(item.id)}"]`, `fabrics.${index}`)));
  if (page === "ourWork") content.workCategories.forEach((item, index) => result.push(target(`story:${item.id}`, `Story · ${item.label}`, `#${CSS.escape(item.slug)}`, `workCategories.${index}`)));
  if (page === "production") content.productionSteps.forEach((item, index) => result.push(target(`step:${item.id}`, `Step · ${item.title}`, `#${CSS.escape(item.slug)}`, `productionSteps.${index}`)));
  return result;
}
export function getAt(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => current !== null && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, value);
}
export function setAt<T>(value: T, path: string, next: unknown): T {
  const copy = structuredClone(value);
  const keys = path.split(".");
  let current = copy as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) current = current[key] as Record<string, unknown>;
  current[keys[keys.length - 1]] = next;
  return copy;
}
