import { initialContent } from "./seed.ts";
import { parseContentSnapshot } from "./schema.ts";

/** Additive v1 content migration. Existing values, collection IDs and private edits win. */
export function extendSnapshot(value: unknown) {
  const content = parseContentSnapshot(value);
  const seed = parseContentSnapshot(initialContent);
  content.editorial ??= structuredClone(seed.editorial);
  for (const page of ["products", "ourWork", "production", "customize"] as const) {
    content.pages[page] = { ...seed.pages[page], ...content.pages[page] };
  }
  content.orderBuilder.recommendedFabricLabel ??= seed.orderBuilder.recommendedFabricLabel;
  content.orderBuilder.defaultQuantity ??= seed.orderBuilder.defaultQuantity;
  for (const category of content.workCategories) {
    category.story.orderLabel ??= seed.workCategories.find((item) => item.id === category.id)?.story.orderLabel ?? `Plan your ${category.label.toLowerCase()} order`;
  }
  // Only bind untouched original directory entries; never change customized copy.
  for (const detail of content.pages.home.footer.details) {
    const original = seed.pages.home.footer.details.find((item) => item.label === detail.label && item.value === detail.value);
    if (original?.source && !detail.source) detail.source = original.source;
  }
  return parseContentSnapshot(content);
}
