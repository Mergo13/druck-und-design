import { z } from "zod";
import {
  getCategories,
  getGlobalProperties,
  getIndustries,
  getProducts,
  upsertCategory,
  upsertGlobalProperty,
  upsertIndustry,
  upsertProduct
} from "@/lib/catalog-repository";
import { mergeProductConfigFromCsv, productConfigFromCsvRow } from "@/lib/catalog-csv-config";
import { productPropertyFromGlobal } from "@/lib/product-property-pricing";
import { validateProductPricing } from "@/lib/print-workflow";
import type { GlobalProperty, ProductCatalogItem, ProductCategory, ProductIndustry } from "@/types/print-platform";

export type CsvResource = "products" | "categories" | "properties" | "industries";

export const csvResources = new Set<CsvResource>(["products", "categories", "properties", "industries"]);

const productFields = [
  "slug",
  "name",
  "category",
  "productStatus",
  "basePrice",
  "pricingType",
  "configuratorProfile",
  "pricingProfile",
  "experienceProfile",
  "pdfAnalysisMode",
  "short",
  "description",
  "seo",
  "visible",
  "published",
  "industrySlugs",
  "tags"
] as const;

const categoryFields = ["slug", "name", "description", "visible", "published"] as const;
const propertyFields = ["slug", "name", "active", "sortOrder", "values"] as const;
const industryFields = ["slug", "name", "description", "visible", "published", "sortOrder", "featured", "productSlugs"] as const;

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = Array.isArray(value) || (typeof value === "object" && value !== null) ? JSON.stringify(value) : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function stringifyCsv(rows: Array<Record<string, unknown>>, fields: readonly string[]) {
  const lines = [fields.map(escapeCsvCell).join(";")];
  for (const row of rows) {
    lines.push(fields.map((field) => escapeCsvCell(row[field])).join(";"));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [";", ",", "\t"];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ";";
}

export function parseCsv(text: string) {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  const headers = rows[0]?.map((value) => value.trim()) ?? [];
  const records = rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])));
  return { delimiter, headers, records };
}

function parseBoolean(value: string | undefined) {
  if (!value) return undefined;
  if (/^(true|1|yes|ja|y)$/i.test(value)) return true;
  if (/^(false|0|no|nein|n)$/i.test(value)) return false;
  return undefined;
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : undefined;
    } catch {
      return undefined;
    }
  }
  return trimmed.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
}

const productCsvSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  productStatus: z.enum(["draft", "active", "inactive"]).optional(),
  basePrice: z.number().nonnegative().optional(),
  pricingType: z.enum(["fixed", "tiered", "area", "hourly"]).optional(),
  short: z.string().optional(),
  description: z.string().optional(),
  seo: z.string().optional(),
  visible: z.boolean().optional(),
  published: z.boolean().optional(),
  industrySlugs: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export async function csvRowsForResource(resource: CsvResource) {
  if (resource === "products") {
    const products = await getProducts();
    return { fields: productFields, rows: products.map((product) => ({ ...product, pricingProfile: typeof product.pricingProfile === "object" ? product.pricingProfile.key : product.pricingProfile })) };
  }
  if (resource === "categories") {
    return { fields: categoryFields, rows: await getCategories() };
  }
  if (resource === "properties") {
    return { fields: propertyFields, rows: await getGlobalProperties() };
  }
  return { fields: industryFields, rows: await getIndustries() };
}

export function csvTemplateForResource(resource: CsvResource) {
  if (resource === "products") {
    return stringifyCsv([
      {
        slug: "business-cards",
    name: "Visitenkarten",
        category: "print",
        productStatus: "active",
        basePrice: "29,90",
        pricingType: "fixed",
        configuratorProfile: "standard",
        pricingProfile: "business-card",
        experienceProfile: "cards",
        pdfAnalysisMode: "optional",
        short: "Kurzbeschreibung",
        description: "Beschreibung",
        seo: "SEO Text",
        visible: "true",
        published: "true",
        industrySlugs: "unternehmen-bueros|start-ups",
        tags: "visitenkarten|druck"
      }
    ], productFields);
  }
  if (resource === "categories") {
    return stringifyCsv([{ slug: "print", name: "Print", description: "Druckprodukte", visible: "true", published: "true" }], categoryFields);
  }
  if (resource === "properties") {
    return stringifyCsv([{ slug: "papier", name: "Papier", active: "true", sortOrder: "10", values: "[]" }], propertyFields);
  }
  return stringifyCsv([{ slug: "unternehmen", name: "Unternehmen", description: "Drucksorten für Unternehmen", visible: "true", published: "true", sortOrder: "10", featured: "false", productSlugs: "flyer|visitenkarten" }], industryFields);
}

export type ProductImportStrategy = "skip" | "update" | "duplicate";
export type ProductImportMode = "merge" | "price-update-only" | "properties-update-only" | "full-replace";
type CsvValidationOptions = {
  includeRows?: boolean;
};

function parsePriceTiers(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const tiers = value.split("|").map((part) => {
    const [range, priceRaw] = part.split(":");
    const [fromRaw, toRaw] = (range ?? "").split("-");
    const fromQuantity = parseNumber(fromRaw);
    const toQuantity = parseNumber(toRaw);
    const unitPrice = parseNumber(priceRaw);
    if (!fromQuantity || unitPrice === undefined) return null;
    return {
      quantity: fromQuantity,
      fromQuantity,
      toQuantity,
      price: unitPrice,
      unitPrice
    };
  });
  if (tiers.some((tier) => !tier)) return undefined;
  return tiers as NonNullable<ProductCatalogItem["priceTiers"]>;
}

function parsePricingPropertySlugs(value: string | undefined) {
  if (!value?.trim()) return undefined;
  return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
}

export async function validateProductCsv(
  text: string,
  strategy: ProductImportStrategy = "update",
  mode: ProductImportMode = "merge",
  options: CsvValidationOptions = {}
) {
  const parsed = parseCsv(text);
  const [products, categories, globalProperties] = await Promise.all([getProducts(), getCategories(), getGlobalProperties()]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const globalBySlug = new Map(globalProperties.map((property) => [property.slug, property]));
  const seen = new Set<string>();
  const includeRows = options.includeRows !== false;
  const results: Array<{
    index: number;
    input: Record<string, string>;
    product?: ProductCatalogItem;
    status: "create" | "update" | "skip" | "error";
    errors: string[];
    warnings: string[];
  }> = [];
  const preview: Array<{
    index: number;
    status: "create" | "update" | "skip" | "error";
    errors: string[];
    warnings: string[];
    product?: Pick<ProductCatalogItem, "slug" | "name" | "category" | "basePrice" | "productStatus">;
  }> = [];
  let valid = 0;
  let errorCount = 0;
  let warningCount = 0;

  for (const [index, row] of parsed.records.entries()) {
    const basePrice = parseNumber(row.basePrice ?? row.preis);
    const csvProduct = {
      slug: row.slug || row.productSlug || row.product_slug || "",
      name: row.name || row.Name || row.Produkt || undefined,
      category: row.category || row.kategorie || undefined,
      productStatus: row.productStatus || row.status || undefined,
      basePrice,
      pricingType: row.pricingType || row.preisart || undefined,
      short: row.short || undefined,
      description: row.description || undefined,
      seo: row.seo || undefined,
      visible: parseBoolean(row.visible),
      published: parseBoolean(row.published),
      industrySlugs: parseList(row.industrySlugs),
      tags: parseList(row.tags)
    };
    const errors: string[] = [];
    const warnings: string[] = [];
    const parsedRow = productCsvSchema.safeParse(csvProduct);
    if (!parsedRow.success) {
      errors.push(...parsedRow.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
    }
    if (csvProduct.slug && seen.has(csvProduct.slug)) errors.push(`Doppelter Slug in CSV: ${csvProduct.slug}`);
    if (csvProduct.slug) seen.add(csvProduct.slug);

    const existing = csvProduct.slug ? bySlug.get(csvProduct.slug) : undefined;
    if (!existing && (!csvProduct.name || !csvProduct.category)) {
      errors.push("Neue Produkte benötigen Name und Kategorie.");
    }
    if (csvProduct.category && !categorySlugs.has(csvProduct.category)) {
      errors.push(`Unbekannte Kategorie: ${csvProduct.category}`);
    }
    const priceTiers = parsePriceTiers(row.priceTiers ?? row.price_tiers ?? row.preisstaffeln);
    const pricingPropertySlugs = parsePricingPropertySlugs(row.pricingProperties ?? row.pricing_properties ?? row.eigenschaften);
    if ((mode === "price-update-only" || row.priceTiers) && !priceTiers?.length) {
      errors.push("Preisstaffeln müssen im Format 1-9:1.50|10-24:0.85 angegeben werden.");
    }
    if ((mode === "properties-update-only" || row.pricingProperties) && !pricingPropertySlugs?.length) {
      errors.push("pricingProperties muss Eigenschafts-Slugs mit | oder , enthalten.");
    }
    const selectedProperties = pricingPropertySlugs?.map((propertySlug) => {
      const property = globalBySlug.get(propertySlug);
      if (!property) errors.push(`Unbekannte Eigenschaft: ${propertySlug}`);
      return property;
    }).filter(Boolean) as GlobalProperty[] | undefined;

    const product = existing
      ? mode === "price-update-only"
        ? { ...existing, priceTiers: priceTiers ?? existing.priceTiers, pricingType: existing.pricingType === "tiered" ? existing.pricingType : "tiered" }
        : mode === "properties-update-only"
          ? { ...existing, pricingProperties: selectedProperties?.map((property) => productPropertyFromGlobal(property, existing.priceTiers)) ?? existing.pricingProperties }
          : {
              ...mergeProductConfigFromCsv(existing, row),
              ...Object.fromEntries(Object.entries(parsedRow.success ? parsedRow.data : {}).filter(([, value]) => value !== undefined)),
              ...(priceTiers ? { priceTiers, pricingType: "tiered" as const } : {}),
              ...(selectedProperties ? { pricingProperties: selectedProperties.map((property) => productPropertyFromGlobal(property, priceTiers ?? existing.priceTiers)) } : {})
            }
      : ({
          slug: csvProduct.slug,
          name: csvProduct.name ?? "",
          category: csvProduct.category ?? "",
          visible: csvProduct.visible ?? true,
          published: csvProduct.published ?? true,
          short: csvProduct.short ?? "",
          description: csvProduct.description ?? "",
          seo: csvProduct.seo ?? "",
          heroImage: "",
          gallery: [],
          rating: 5,
          basePrice: csvProduct.basePrice ?? 0,
          pricingType: csvProduct.pricingType ?? "fixed",
          deliveryText: "",
          tags: csvProduct.tags ?? [],
          variants: [],
          pricingProperties: [],
          priceTiers: [{ quantity: 1, price: csvProduct.basePrice ?? 0 }],
          productStatus: csvProduct.productStatus ?? "draft",
          industrySlugs: csvProduct.industrySlugs ?? [],
          ...(priceTiers ? { priceTiers, pricingType: "tiered" as const } : {}),
          ...(selectedProperties ? { pricingProperties: selectedProperties.map((property) => productPropertyFromGlobal(property, priceTiers)) } : {}),
          ...productConfigFromCsvRow(row)
        } as ProductCatalogItem);

    const pricingErrors = validateProductPricing(product);
    if (pricingErrors.length) errors.push(...pricingErrors);

    const status = errors.length ? "error" : existing ? (strategy === "skip" ? "skip" : strategy === "duplicate" ? "create" : "update") : "create";
    if (existing && strategy === "duplicate") {
      product.slug = `${product.slug}-${Date.now()}-${index + 1}`;
      warnings.push(`Duplikat-Strategie hat den Slug geändert zu ${product.slug}`);
    }

    if (status === "error") errorCount += 1;
    else valid += 1;
    warningCount += warnings.length;
    if (preview.length < 20) {
      preview.push({
        index: index + 2,
        status,
        errors,
        warnings,
        product: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          basePrice: product.basePrice,
          productStatus: product.productStatus
        }
      });
    }
    if (includeRows) {
      results.push({ index: index + 2, input: row, product, status, errors, warnings });
    }
  }

  return {
    delimiter: parsed.delimiter,
    headers: parsed.headers,
    rowCount: parsed.records.length,
    valid,
    warnings: warningCount,
    errors: errorCount,
    preview,
    rows: results
  };
}

function jsonArray(value: string | undefined) {
  if (!value?.trim()) return [];
  const list = parseList(value);
  if (list) return list;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function validateSimpleCsvResource(
  resource: Exclude<CsvResource, "products">,
  text: string,
  strategy: ProductImportStrategy,
  options: CsvValidationOptions = {}
) {
  const parsed = parseCsv(text);
  const existingRows = resource === "categories" ? await getCategories() : resource === "properties" ? await getGlobalProperties() : await getIndustries();
  const existingSlugs = new Set(existingRows.map((row) => row.slug));
  const seen = new Set<string>();
  const includeRows = options.includeRows !== false;
  const rows: Array<{
    index: number;
    input: Record<string, string>;
    status: "create" | "update" | "skip" | "error";
    errors: string[];
    warnings: string[];
  }> = [];
  const preview: Array<{
    index: number;
    status: "create" | "update" | "skip" | "error";
    errors: string[];
    warnings: string[];
    product: { slug?: string; name?: string; category: CsvResource };
  }> = [];
  let valid = 0;
  let errorCount = 0;
  let warningCount = 0;
  parsed.records.forEach((row, index) => {
    const slug = row.slug || "";
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!slug) errors.push("Slug ist erforderlich.");
    if (!row.name) errors.push("Name ist erforderlich.");
    if (slug && seen.has(slug)) errors.push(`Doppelter Slug in CSV: ${slug}`);
    if (slug) seen.add(slug);
    const exists = existingSlugs.has(slug);
    const status = errors.length ? "error" : exists ? (strategy === "skip" ? "skip" : strategy === "duplicate" ? "create" : "update") : "create";
    if (status === "error") errorCount += 1;
    else valid += 1;
    warningCount += warnings.length;
    if (preview.length < 20) {
      preview.push({
        index: index + 2,
        status,
        errors,
        warnings,
        product: { slug: row.slug, name: row.name, category: resource }
      });
    }
    if (includeRows) {
      rows.push({ index: index + 2, input: row, status, errors, warnings });
    }
  });
  return {
    delimiter: parsed.delimiter,
    headers: parsed.headers,
    rowCount: parsed.records.length,
    valid,
    warnings: warningCount,
    errors: errorCount,
    preview,
    rows
  };
}

export async function validateCsvResource(
  resource: CsvResource,
  text: string,
  strategy: ProductImportStrategy = "update",
  mode: ProductImportMode = "merge",
  options: CsvValidationOptions = {}
) {
  if (resource === "products") return validateProductCsv(text, strategy, mode, options);
  return validateSimpleCsvResource(resource, text, strategy, options);
}

export async function importProductCsv(text: string, strategy: ProductImportStrategy = "update", mode: ProductImportMode = "merge") {
  const validation = await validateProductCsv(text, strategy, mode);
  const result = { created: 0, updated: 0, skipped: 0, failed: validation.errors, errors: validation.preview.filter((row) => row.errors.length) };

  for (const row of validation.rows) {
    if (row.status === "error" || !row.product) continue;
    if (row.status === "skip") {
      result.skipped += 1;
      continue;
    }
    await upsertProduct(row.product);
    if (row.status === "update") result.updated += 1;
    else result.created += 1;
  }

  return result;
}

export async function importCsvResource(resource: CsvResource, text: string, strategy: ProductImportStrategy = "update", mode: ProductImportMode = "merge") {
  if (resource === "products") return importProductCsv(text, strategy, mode);
  const validation = await validateSimpleCsvResource(resource, text, strategy);
  const result = { created: 0, updated: 0, skipped: 0, failed: validation.errors, errors: validation.preview.filter((row) => row.errors.length) };
  for (const row of validation.rows) {
    if (row.status === "error") continue;
    if (row.status === "skip") {
      result.skipped += 1;
      continue;
    }
    const slug = row.input.slug;
    const nextSlug = row.status === "create" && strategy === "duplicate" ? `${slug}-${Date.now()}-${row.index}` : slug;
    if (resource === "categories") {
      await upsertCategory({
        slug: nextSlug,
        name: row.input.name,
        description: row.input.description ?? "",
        visible: parseBoolean(row.input.visible) ?? true,
        published: parseBoolean(row.input.published) ?? true
      } satisfies ProductCategory);
    } else if (resource === "properties") {
      await upsertGlobalProperty({
        slug: nextSlug,
        name: row.input.name,
        active: parseBoolean(row.input.active) ?? true,
        sortOrder: parseNumber(row.input.sortOrder) ?? 0,
        values: jsonArray(row.input.values) as GlobalProperty["values"]
      } satisfies GlobalProperty);
    } else {
      await upsertIndustry({
        slug: nextSlug,
        name: row.input.name,
        description: row.input.description ?? "",
        visible: parseBoolean(row.input.visible) ?? true,
        published: parseBoolean(row.input.published) ?? true,
        sortOrder: parseNumber(row.input.sortOrder) ?? 0,
        featured: parseBoolean(row.input.featured) ?? false,
        productSlugs: parseList(row.input.productSlugs) ?? []
      } satisfies ProductIndustry);
    }
    if (row.status === "update") result.updated += 1;
    else result.created += 1;
  }
  return result;
}
