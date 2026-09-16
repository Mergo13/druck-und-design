import "server-only";
import { z } from "zod";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { priceCartItems } from "@/lib/cart-pricing";
import type { UserAccount } from "@/types";
import type { ProductCatalogItem, ProductCategory, ProductCategoryProperty } from "@/types/print-platform";
import type {
  AICommerceCartEntry,
  AICommerceCommand,
  AICommerceItem,
  AICommerceOption,
  AICommerceResponse,
  AICommerceScalar,
  AICommerceState,
  AICommerceStateInput
} from "@/lib/ai-commerce-types";
import { aiCommerceDebug } from "@/lib/ai-commerce-debug";

const MAX_WORKSPACE_ITEMS = 8;

const unresolvedSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(160)
}).strict();

export const commerceStateInputSchema = z.object({
  activeItemId: z.string().trim().max(80).nullable().default(null),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    productSlug: z.string().trim().min(1).max(160),
    quantity: z.number().finite().positive(),
    configuration: z.record(z.string().max(160), z.string().max(300)).refine((value) => Object.keys(value).length <= 50),
    unresolved: z.array(unresolvedSchema).max(12).optional().default([])
  }).strict()).max(MAX_WORKSPACE_ITEMS).default([])
}).strict();

type CommerceAuth = {
  authenticated: boolean;
  user?: Pick<UserAccount, "id" | "studentVerification"> | null;
  studentDiscountPercent?: number | null;
};

type CommerceCatalog = {
  products: ProductCatalogItem[];
  categories: ProductCategory[];
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("de-AT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function valueLabel(value: ProductCategoryProperty["values"][number]) {
  return typeof value === "string"
    ? { value, label: value }
    : { value: value.value, label: value.label || value.value };
}

function productOptions(product: ProductCatalogItem, category?: ProductCategory): AICommerceOption[] {
  const options: AICommerceOption[] = [];
  const seen = new Set<string>();
  const addOption = (option: AICommerceOption) => {
    if (seen.has(option.key) || (option.kind === "select" && !option.values?.length)) return;
    seen.add(option.key);
    options.push(option);
  };

  for (const attribute of product.variants[0]?.attributes ?? []) {
    if (attribute.type !== "select") continue;
    addOption({
      key: attribute.key,
      label: attribute.label,
      kind: "select",
      required: attribute.required,
      values: (attribute.options ?? []).map((option) => ({ value: option.value, label: option.label }))
    });
  }

  if (product.pricingProperties?.length) {
    for (const property of product.pricingProperties) {
      addOption({
        key: `eigenschaft:${property.name}`,
        label: property.name,
        kind: "select",
        required: Boolean(property.required),
        values: (property.values ?? [])
          .filter((value) => value.enabled !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((value) => ({ value: value.value, label: value.labelOverride || value.label || value.value }))
      });
    }
  } else {
    const enabled = new Set(product.enabledCategoryProperties ?? []);
    for (const property of category?.properties ?? []) {
      if (!enabled.has(property.name)) continue;
      addOption({
        key: `eigenschaft:${property.name}`,
        label: property.name,
        kind: "select",
        required: true,
        values: property.values.map(valueLabel)
      });
    }
  }

  if (product.pricingType === "area") {
    addOption({
      key: "areaWidthCm",
      label: "Breite (cm)",
      kind: "number",
      required: true,
      min: product.areaPricing?.minWidthCm ?? 1,
      max: product.areaPricing?.maxWidthCm,
      step: 1
    });
    addOption({
      key: "areaHeightCm",
      label: "Höhe (cm)",
      kind: "number",
      required: true,
      min: product.areaPricing?.minHeightCm ?? 1,
      max: product.areaPricing?.maxHeightCm,
      step: 1
    });
  }

  return options;
}

function defaultConfiguration(product: ProductCatalogItem, options: AICommerceOption[]) {
  const configuration: Record<string, string> = {};
  for (const option of options) {
    if (option.kind === "number") {
      if (option.key === "areaWidthCm") configuration[option.key] = String(product.areaPricing?.defaultWidthCm ?? option.min ?? 1);
      if (option.key === "areaHeightCm") configuration[option.key] = String(product.areaPricing?.defaultHeightCm ?? option.min ?? 1);
      continue;
    }
    const attribute = product.variants[0]?.attributes.find((entry) => entry.key === option.key);
    const propertyName = option.key.startsWith("eigenschaft:") ? option.key.slice("eigenschaft:".length) : "";
    const property = product.pricingProperties?.find((entry) => entry.name === propertyName);
    const propertyDefault = property?.values.find((value) => value.enabled !== false && value.defaultSelected)?.value;
    const requestedDefault = attribute?.defaultValue === undefined ? undefined : String(attribute.defaultValue);
    configuration[option.key] = propertyDefault
      ?? option.values?.find((value) => value.value === requestedDefault)?.value
      ?? option.values?.[0]?.value
      ?? "";
  }
  return configuration;
}

function quantityRules(product: ProductCatalogItem) {
  const variantRule = product.variants[0]?.quantityRule;
  const choices = Array.from(new Set((product.quantitySteps ?? [])
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0)))
    .sort((a, b) => a - b);
  return {
    min: Math.max(1, Number(variantRule?.min ?? choices[0] ?? 1)),
    max: Math.max(1, Number(variantRule?.max ?? choices.at(-1) ?? 100_000)),
    step: Math.max(1, Number(variantRule?.step ?? 1)),
    choices
  };
}

function safeQuantity(product: ProductCatalogItem, value: unknown) {
  const rules = quantityRules(product);
  const numeric = Number(value);
  const rounded = Number.isFinite(numeric) ? Math.round(numeric) : rules.min;
  return Math.min(rules.max, Math.max(rules.min, rounded));
}

function optionAliases(option: AICommerceOption) {
  const normalized = normalize(`${option.key} ${option.label}`);
  const aliases = [normalized];
  if (/papier|material/.test(normalized)) aliases.push("paper", "papier", "material");
  if (/format|groesse|grosse/.test(normalized)) aliases.push("format", "size", "groesse");
  if (/veredel/.test(normalized)) aliases.push("finish", "finishing", "veredelung");
  if (/druckseite|seitigkeit|bedruck/.test(normalized)) aliases.push("printsides", "print sides", "druckseiten", "seitigkeit");
  if (/seite/.test(normalized)) aliases.push("pages", "seiten");
  if (/bindung/.test(normalized)) aliases.push("binding", "bindung");
  return aliases;
}

function findOption(options: AICommerceOption[], key: string) {
  const target = normalize(key).replace(/\s/g, "");
  const matches = options.filter((option) => optionAliases(option).some((alias) => normalize(alias).replace(/\s/g, "") === target));
  return matches.length === 1 ? matches[0] : undefined;
}

function findAllowedValue(option: AICommerceOption, requested: AICommerceScalar) {
  if (option.kind === "number") {
    const numeric = Number(requested);
    if (!Number.isFinite(numeric)) return undefined;
    return String(Math.min(option.max ?? numeric, Math.max(option.min ?? numeric, numeric)));
  }
  const values = option.values ?? [];
  if (requested === false || requested === null) {
    return values.find((value) => /^(keine?|ohne|nein|no|none)(\s|$)/i.test(normalize(value.value)))?.value;
  }
  const target = normalize(String(requested));
  const exact = values.find((value) => normalize(value.value) === target || normalize(value.label) === target);
  if (exact) return exact.value;
  const partial = values.filter((value) => normalize(value.value).includes(target) || normalize(value.label).includes(target));
  return partial.length === 1 ? partial[0].value : undefined;
}

function stringValue(value: AICommerceScalar) {
  if (value === null) return "entfernen";
  if (typeof value === "boolean") return value ? "ja" : "nein";
  return String(value).slice(0, 160);
}

function applyAttributes(
  product: ProductCatalogItem,
  item: Pick<AICommerceStateInput["items"][number], "quantity" | "configuration" | "unresolved">,
  attributes: Record<string, AICommerceScalar>,
  options: AICommerceOption[]
) {
  let quantity = item.quantity;
  const configuration = { ...item.configuration };
  let unresolved = [...(item.unresolved ?? [])];
  const mapped: Record<string, string | number> = {};
  const rejected: Array<{ key: string; value: string }> = [];

  for (const [key, requested] of Object.entries(attributes)) {
    const normalizedKey = normalize(key).replace(/\s/g, "");
    const isQuantity = ["quantity", "auflage", "menge", "copies", "stuck", "stueck"].includes(normalizedKey);
    unresolved = unresolved.filter((entry) => normalize(entry.key) !== normalize(key));
    if (isQuantity) {
      const numeric = Number(requested);
      if (Number.isFinite(numeric) && numeric > 0) {
        quantity = safeQuantity(product, numeric);
        mapped.quantity = quantity;
      } else {
        const rejectedValue = { key, value: stringValue(requested) };
        unresolved.push(rejectedValue);
        rejected.push(rejectedValue);
      }
      continue;
    }

    const option = findOption(options, key);
    const allowedValue = option ? findAllowedValue(option, requested) : undefined;
    if (option && allowedValue !== undefined) {
      configuration[option.key] = allowedValue;
      mapped[option.key] = allowedValue;
    } else {
      const rejectedValue = { key, value: stringValue(requested) };
      unresolved.push(rejectedValue);
      rejected.push(rejectedValue);
    }
  }

  aiCommerceDebug("attribute-mapping", { product: product.slug, requested: attributes, mapped, rejected });
  return { quantity, configuration, unresolved: unresolved.slice(0, 12) };
}

function productSearchText(product: ProductCatalogItem) {
  return [product.slug, product.name, ...(product.tags ?? [])].map(normalize).filter(Boolean);
}

function resolveProduct(products: ProductCatalogItem[], query: string) {
  const target = normalize(query);
  aiCommerceDebug("product-search", { query, normalizedQuery: target });
  if (!target) return undefined;
  const exact = products.filter((product) => productSearchText(product).includes(target));
  if (exact.length === 1) {
    aiCommerceDebug("matched-product", { slug: exact[0].slug, name: exact[0].name, strategy: "exact" });
    return exact[0];
  }

  const contained = products.filter((product) => productSearchText(product).some((value) => target.includes(value) || value.includes(target)));
  if (contained.length === 1) {
    aiCommerceDebug("matched-product", { slug: contained[0].slug, name: contained[0].name, strategy: "contained" });
    return contained[0];
  }

  const tokens = new Set(target.split(" ").filter((token) => token.length > 2));
  const ranked = products.map((product) => ({
    product,
    score: Math.max(...productSearchText(product).map((value) => value.split(" ").filter((token) => tokens.has(token)).length), 0)
  })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  const match = ranked[0] && ranked[0].score > (ranked[1]?.score ?? 0) ? ranked[0].product : undefined;
  aiCommerceDebug("matched-product", match
    ? { slug: match.slug, name: match.name, strategy: "token" }
    : { match: null, candidates: ranked.slice(0, 3).map((entry) => ({ slug: entry.product.slug, name: entry.product.name, score: entry.score })) });
  return match;
}

function resolveItemRef(state: AICommerceStateInput, itemRef: string | null) {
  if (!state.items.length) return undefined;
  const target = normalize(itemRef || "current");
  if (["current", "active", "aktuell", "dies", "davon"].includes(target)) {
    return state.items.find((item) => item.id === state.activeItemId) ?? state.items[0];
  }
  return state.items.find((item) => item.id === itemRef)
    ?? state.items.find((item) => normalize(item.productSlug) === target)
    ?? state.items.find((item) => normalize(item.productSlug).includes(target) || target.includes(normalize(item.productSlug)));
}

function nextItemId(items: AICommerceStateInput["items"]) {
  const next = items.reduce((max, item) => {
    const match = item.id.match(/^draft-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
  return `draft-${next}`;
}

function selectedLabel(option: AICommerceOption, configuration: Record<string, string>) {
  const value = configuration[option.key] ?? "";
  return option.values?.find((entry) => entry.value === value)?.label ?? value;
}

function displayConfiguration(quantity: number, options: AICommerceOption[], configuration: Record<string, string>) {
  return Object.fromEntries([
    ["Menge", String(quantity)],
    ...options.map((option) => [option.label, selectedLabel(option, configuration)] as [string, string])
  ]);
}

async function renderState(input: AICommerceStateInput, catalog: CommerceCatalog, auth: CommerceAuth): Promise<AICommerceState> {
  const seenIds = new Set<string>();
  const items: AICommerceItem[] = [];

  for (const rawItem of input.items.slice(0, MAX_WORKSPACE_ITEMS)) {
    const product = catalog.products.find((entry) => entry.slug === rawItem.productSlug);
    if (!product || seenIds.has(rawItem.id)) continue;
    seenIds.add(rawItem.id);
    const category = catalog.categories.find((entry) => entry.slug === product.category);
    const options = productOptions(product, category);
    const defaults = defaultConfiguration(product, options);
    const configuration = { ...defaults };
    for (const option of options) {
      const requested = rawItem.configuration[option.key];
      const allowed = requested === undefined ? undefined : findAllowedValue(option, requested);
      if (allowed !== undefined) configuration[option.key] = allowed;
    }
    const quantity = safeQuantity(product, rawItem.quantity);
    const pricingConfig = { ...configuration, auflage: String(quantity) };
    const purchaseMode = product.purchaseMode ?? "both";
    const canPurchase = purchaseMode === "online" || purchaseMode === "both";
    let price: AICommerceItem["price"] = !canPurchase
      ? { status: "request" }
      : auth.authenticated
        ? { status: "request" }
        : { status: "login_required" };
    let cartEntry: AICommerceCartEntry | undefined;

    if (auth.authenticated && canPurchase) {
      try {
        const priced = await priceCartItems({
          items: [{ slug: product.slug, quantity: 1, pricingConfig, config: displayConfiguration(quantity, options, configuration) }],
          user: auth.user,
          studentDiscountPercent: auth.studentDiscountPercent
        });
        const pricedItem = priced.items[0];
        if (pricedItem && Number.isFinite(pricedItem.lineFinalPrice) && pricedItem.lineFinalPrice > 0) {
          price = { status: "available", total: pricedItem.lineFinalPrice, normalTotal: pricedItem.lineNormalPrice };
          cartEntry = {
            slug: product.slug,
            name: product.name,
            category: product.category,
            quantity: 1,
            unitPrice: pricedItem.unitPrice,
            normalUnitPrice: pricedItem.normalUnitPrice,
            pricingConfig: pricedItem.pricingConfig,
            studentDiscountEligible: product.studentDiscountEligible !== false,
            printCheckRequested: false,
            printCheckFee: 0,
            config: displayConfiguration(quantity, options, configuration)
          };
        }
      } catch {
        price = { status: "request" };
      }
    }

    aiCommerceDebug("pricing-result", {
      itemId: rawItem.id,
      product: product.slug,
      pricingConfig,
      result: price
    });

    items.push({
      id: rawItem.id,
      product: {
        slug: product.slug,
        name: product.name,
        href: `/produkt/${encodeURIComponent(product.slug)}`,
        category: product.category
      },
      quantity,
      quantityRules: quantityRules(product),
      configuration,
      options,
      unresolved: (rawItem.unresolved ?? []).map((entry) => ({ key: entry.key.slice(0, 80), value: entry.value.slice(0, 160) })).slice(0, 12),
      price,
      canAddToCart: Boolean(cartEntry),
      cartEntry
    });
    aiCommerceDebug("configured-product", {
      id: rawItem.id,
      product: { slug: product.slug, name: product.name },
      quantity,
      configuration,
      unresolved: rawItem.unresolved ?? [],
      pricing: price
    });
  }

  const activeItemId = items.some((item) => item.id === input.activeItemId)
    ? input.activeItemId
    : items.at(-1)?.id ?? null;
  const total = !items.length
    ? { status: "empty" as const }
    : items.every((item) => item.price.status === "available")
      ? { status: "available" as const, amount: Math.round(items.reduce((sum, item) => sum + (item.price.total ?? 0), 0) * 100) / 100 }
      : items.some((item) => item.price.status === "login_required")
        ? { status: "login_required" as const }
        : { status: "request" as const };

  return { activeItemId, items, total };
}

function stateInputFromRendered(state: AICommerceState): AICommerceStateInput {
  return {
    activeItemId: state.activeItemId,
    items: state.items.map((item) => ({
      id: item.id,
      productSlug: item.product.slug,
      quantity: item.quantity,
      configuration: item.configuration,
      unresolved: item.unresolved
    }))
  };
}

function requestedCommerceItems(state: AICommerceState, refs: string[]) {
  return refs.some((ref) => normalize(ref) === "all")
    ? state.items
    : refs.length
      ? state.items.filter((item) => refs.includes(item.id) || refs.some((ref) => normalize(ref) === normalize(item.product.slug)))
      : state.items.filter((item) => item.id === state.activeItemId);
}

function unresolvedSummary(item: { unresolved?: Array<{ key: string; value: string }> }) {
  if (!item.unresolved?.length) return "";
  return ` Nicht im realen Konfigurator verfügbar: ${item.unresolved.map((entry) => `${entry.key} „${entry.value}“`).join(", ")}.`;
}

export async function createCommerceCatalogContext() {
  const [products, categories] = await Promise.all([getPublicProducts(), getPublicCategories()]);
  return { products, categories };
}

export function commerceCatalogForModel(catalog: CommerceCatalog) {
  return catalog.products.slice(0, 120).map((product) => {
    const category = catalog.categories.find((entry) => entry.slug === product.category);
    const options = productOptions(product, category);
    return {
      slug: product.slug,
      name: product.name,
      tags: (product.tags ?? []).slice(0, 8),
      attributes: [
        "quantity",
        ...options.map((option) => `${option.key} (${option.label}): ${option.kind === "select" ? option.values?.map((value) => value.value).join(" | ") : `${option.min ?? 1}-${option.max ?? "offen"}`}`)
      ]
    };
  });
}

export async function synchronizeCommerceState(input: AICommerceStateInput, catalog: CommerceCatalog, auth: CommerceAuth): Promise<AICommerceResponse> {
  const state = await renderState(input, catalog, auth);
  return { reply: "Konfiguration aktualisiert.", action: "sync", state };
}

export async function applyCommerceCommand(
  command: AICommerceCommand,
  input: AICommerceStateInput,
  catalog: CommerceCatalog,
  auth: CommerceAuth
): Promise<AICommerceResponse> {
  const current = await renderState(input, catalog, auth);
  const draft = stateInputFromRendered(current);
  let reply = "Ich konnte die Anfrage noch nicht eindeutig zuordnen.";

  if (command.action === "configure_product" || command.action === "add_product") {
    const product = resolveProduct(catalog.products, command.productQuery ?? "");
    if (!product) {
      const query = command.productQuery || "das gewünschte Produkt";
      const suggestions = catalog.products
        .filter((entry) => productSearchText(entry).some((value) => normalize(query).split(" ").some((token) => token.length > 2 && value.includes(token))))
        .slice(0, 3);
      const suggestionText = suggestions.length ? ` Mögliche Shopprodukte: ${suggestions.map((entry) => entry.name).join(", ")}.` : "";
      return { reply: `Ich habe verstanden, dass Sie ${query} benötigen, konnte aber noch kein passendes Shopprodukt eindeutig zuordnen.${suggestionText}`, action: "request_information", state: current };
    }
    if (draft.items.length >= MAX_WORKSPACE_ITEMS) {
      return { reply: `Es können maximal ${MAX_WORKSPACE_ITEMS} Produkte gleichzeitig konfiguriert werden.`, action: command.action, state: current };
    }
    const category = catalog.categories.find((entry) => entry.slug === product.category);
    const options = productOptions(product, category);
    const created = {
      id: nextItemId(draft.items),
      productSlug: product.slug,
      quantity: safeQuantity(product, command.attributes.quantity ?? command.attributes.auflage ?? 1),
      configuration: defaultConfiguration(product, options),
      unresolved: [] as Array<{ key: string; value: string }>
    };
    const applied = applyAttributes(product, created, command.attributes, options);
    Object.assign(created, applied);
    draft.items.push(created);
    draft.activeItemId = created.id;
    reply = `${product.name} wurde mit den verfügbaren Katalogoptionen konfiguriert.${unresolvedSummary(created)}`;
  }

  if (command.action === "update_item") {
    const target = resolveItemRef(draft, command.itemRef);
    const product = target ? catalog.products.find((entry) => entry.slug === target.productSlug) : undefined;
    if (!target || !product) {
      return { reply: "Die gewünschte Position wurde nicht gefunden.", action: command.action, state: current };
    }
    const category = catalog.categories.find((entry) => entry.slug === product.category);
    Object.assign(target, applyAttributes(product, target, command.attributes, productOptions(product, category)));
    draft.activeItemId = target.id;
    reply = `${product.name} wurde aktualisiert.${unresolvedSummary(target)}`;
  }

  if (command.action === "remove_item") {
    const target = resolveItemRef(draft, command.itemRef);
    if (!target) return { reply: "Die gewünschte Position wurde nicht gefunden.", action: command.action, state: current };
    const product = catalog.products.find((entry) => entry.slug === target.productSlug);
    draft.items = draft.items.filter((item) => item.id !== target.id);
    draft.activeItemId = draft.items.at(-1)?.id ?? null;
    reply = `${product?.name ?? "Die Position"} wurde aus der Zusammenstellung entfernt.`;
  }

  if (command.action === "request_information") {
    reply = command.fields.length
      ? `Bitte ergänzen Sie noch: ${command.fields.join(", ")}.`
      : "Bitte ergänzen Sie die noch fehlenden Angaben.";
  }

  const state = await renderState(draft, catalog, auth);

  if (command.action === "quote_total") {
    reply = state.total.status === "available"
      ? `Der aktuell vom Shopsystem berechnete Gesamtpreis beträgt ${state.total.amount?.toLocaleString("de-AT", { style: "currency", currency: "EUR" })}.`
      : state.total.status === "login_required"
        ? "Bitte melden Sie sich an, damit das Shopsystem die aktuellen Preise berechnen kann."
        : "Mindestens eine Position kann nur auf Anfrage kalkuliert werden.";
  }

  if (command.action === "add_to_cart") {
    const requested = requestedCommerceItems(state, command.itemRefs);
    if (!requested.length) {
      return { reply: "Es ist noch kein konfiguriertes Produkt vorhanden. Beschreiben Sie zuerst, was Sie benötigen.", action: command.action, state, cartItems: [] };
    }
    if (!auth.authenticated) {
      return { reply: "Bitte melden Sie sich an, bevor Sie die Konfiguration in den Warenkorb legen.", action: command.action, state, cartItems: [] };
    }
    const unavailable = requested.filter((item) => !item.cartEntry);
    if (unavailable.length) {
      return {
        reply: `${unavailable.map((item) => item.product.name).join(", ")} ${unavailable.length === 1 ? "kann" : "können"} derzeit nur per Anfrage bestellt werden.`,
        action: command.action,
        state,
        cartItems: []
      };
    }
    const cartItems = requested.flatMap((item) => item.cartEntry ? [item.cartEntry] : []);
    reply = `${cartItems.length} ${cartItems.length === 1 ? "Position wurde" : "Positionen wurden"} für den Warenkorb validiert.`;
    return { reply, action: command.action, state, cartItems };
  }

  return { reply, action: command.action, state };
}
