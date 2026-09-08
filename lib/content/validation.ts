import type { ContentSnapshot } from "./schema";

export function validateOrderBuilderConfig(config: ContentSnapshot["orderBuilder"]): string[] {
  const errors: string[] = [];
  for (const [label, values] of [["Customization options", config.customizationOptions], ["Sizing options", config.sizingOptions]] as const) {
    if (!values.length) errors.push(`${label} must contain at least one option.`);
    if (values.some((value) => !value.trim())) errors.push(`${label} cannot contain blank options.`);
    if (values.some((value) => value.length > 160)) errors.push(`${label} must be 160 characters or fewer per option.`);
    if (new Set(values.map((value) => value.trim().toLowerCase())).size !== values.length) errors.push(`${label} must not contain duplicates.`);
  }
  if (!config.customizationOptions.includes(config.defaultCustomization)) errors.push("Default customization must match a customization option.");
  if (!config.sizingOptions.includes(config.defaultSizing)) errors.push("Default sizing must match a sizing option.");
  if (!config.defaultProduct.trim()) errors.push("Choose a default product.");
  if (!config.defaultFabric.trim()) errors.push("Choose a default fabric.");
  if (!/^[1-9][0-9]{0,5}$/.test(config.defaultQuantity ?? "")) errors.push("Default quantity must be a positive whole number up to 6 digits.");
  if (config.recommendedFabricLabel !== undefined && !config.recommendedFabricLabel.trim()) errors.push("Recommended fabric label cannot be blank.");
  return errors;
}
