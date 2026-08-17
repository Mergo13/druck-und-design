import { promises as fs } from "fs";
import path from "path";
import { defaultBindingSystems, defaultBindingVariants, type BindingSystem, type BindingVariant } from "@/lib/binding-resolution";

export type ProductionBindingConfig = {
  bindingSystems: BindingSystem[];
  bindingVariants: BindingVariant[];
  updatedAt?: string;
};

const configPath = path.join(process.cwd(), "data", "production-binding-config.json");

export function defaultProductionBindingConfig(): ProductionBindingConfig {
  return {
    bindingSystems: defaultBindingSystems,
    bindingVariants: defaultBindingVariants,
    updatedAt: new Date().toISOString()
  };
}

export async function getProductionBindingConfig(): Promise<ProductionBindingConfig> {
  const raw = await fs.readFile(configPath, "utf8").catch(() => "");
  if (!raw.trim()) return defaultProductionBindingConfig();
  try {
    const parsed = JSON.parse(raw) as Partial<ProductionBindingConfig>;
    return {
      bindingSystems: Array.isArray(parsed.bindingSystems) && parsed.bindingSystems.length ? parsed.bindingSystems : defaultBindingSystems,
      bindingVariants: Array.isArray(parsed.bindingVariants) ? parsed.bindingVariants : defaultBindingVariants,
      updatedAt: parsed.updatedAt
    };
  } catch {
    return defaultProductionBindingConfig();
  }
}

export async function saveProductionBindingConfig(config: ProductionBindingConfig) {
  const next: ProductionBindingConfig = {
    bindingSystems: config.bindingSystems,
    bindingVariants: config.bindingVariants,
    updatedAt: new Date().toISOString()
  };
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
