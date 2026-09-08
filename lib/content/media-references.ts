export function collectMediaIds(value: unknown): string[] {
  const result = new Set<string>();
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if ("assetId" in node && typeof node.assetId === "string") result.add(node.assetId);
    for (const child of Object.values(node)) walk(child);
  }
  walk(value);
  return [...result];
}
