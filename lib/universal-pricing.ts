import { calculateConfiguredProductPrice } from "@/lib/print-workflow";
import { resolvePricingQuantity, type PricingProductionContext } from "@/lib/pricing-quantity";
import type {
  GlobalProperty,
  PricingComponentResult,
  PricingGuardConfig,
  PricingResult,
  PricingRoundingRule,
  PricingWarning,
  ProductCatalogItem,
  ProductPricingComponent,
  ProductPricingProfileConfig
} from "@/types/print-platform";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function safeQuantity(quantity: number) {
  return Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
}

function roundWithRule(value: number, rule: PricingRoundingRule | undefined) {
  if (!rule || rule === "none" || rule === "cent") return money(value);
  if (rule === "ten_cent") return money(Math.ceil(value * 10) / 10);
  if (rule === "fifty_cent") return money(Math.ceil(value * 2) / 2);
  if (rule === "whole") return money(Math.ceil(value));
  if (rule === "psychological") {
    const rounded = Math.ceil(value);
    return money(Math.max(0, rounded - 0.1));
  }
  return money(value);
}

function profileConfig(product: ProductCatalogItem): ProductPricingProfileConfig | null {
  if (!product.pricingProfile) return null;
  return typeof product.pricingProfile === "string"
    ? { key: product.pricingProfile, components: product.pricingComponents, guards: product.pricingGuards }
    : {
      ...product.pricingProfile,
      components: product.pricingComponents ?? product.pricingProfile.components,
      guards: { ...(product.pricingProfile.guards ?? {}), ...(product.pricingGuards ?? {}) }
    };
}

function globalComponentPrice(component: ProductPricingComponent, globalProperties: GlobalProperty[]) {
  if (component.pricingSource !== "global") return {};
  const property = globalProperties.find((item) => item.slug === component.propertyId);
  const value = property?.values.find((item) => item.id === component.propertyValueId || item.value === component.propertyValueId);
  return {
    sellingPrice: value?.fixedPrice,
    costPrice: value?.costPrice
  };
}

function resolveUnitPrices(component: ProductPricingComponent, globalProperties: GlobalProperty[]) {
  const globalPrice = globalComponentPrice(component, globalProperties);
  const baseCost = Number(component.costOverride ?? component.costPrice ?? globalPrice.costPrice);
  const costPrice = Number.isFinite(baseCost) && baseCost >= 0 ? baseCost : undefined;
  const baseSelling = Number(component.priceOverride ?? component.sellingPrice ?? globalPrice.sellingPrice);
  if (Number.isFinite(baseSelling) && baseSelling >= 0) {
    return { sellingPrice: baseSelling, costPrice };
  }
  const markup = Number(component.markupOverride);
  if (costPrice !== undefined && Number.isFinite(markup) && markup >= 0) {
    return { sellingPrice: money(costPrice * (1 + markup / 100)), costPrice };
  }
  return { sellingPrice: undefined, costPrice };
}

function applyGuards(result: PricingResult, guards: PricingGuardConfig | undefined) {
  let customerPrice = result.customerPrice;
  const warnings: PricingWarning[] = [...(result.warnings ?? [])];
  let minimumPriceApplied = false;
  let marginGuardApplied = false;
  const minimumOrderPrice = Number(guards?.minimumOrderPrice);
  if (Number.isFinite(minimumOrderPrice) && minimumOrderPrice > customerPrice) {
    customerPrice = minimumOrderPrice;
    minimumPriceApplied = true;
    warnings.push({ code: "minimumPriceApplied", message: "Mindestbestellwert wurde angewendet." });
  }
  const minimumMarginPercent = Number(guards?.minimumMarginPercent);
  if (result.productionCost !== undefined && Number.isFinite(minimumMarginPercent) && minimumMarginPercent > 0 && minimumMarginPercent < 100) {
    const marginFloor = result.productionCost / (1 - minimumMarginPercent / 100);
    if (marginFloor > customerPrice) {
      customerPrice = marginFloor;
      marginGuardApplied = true;
      warnings.push({ code: "marginGuardApplied", message: "Mindestmarge wurde angewendet." });
    }
  }
  customerPrice = roundWithRule(customerPrice, guards?.roundingRule);
  const productionCost = result.productionCost;
  const contribution = productionCost === undefined ? undefined : money(customerPrice - productionCost);
  const marginPercent = productionCost === undefined || customerPrice <= 0 ? undefined : money((customerPrice - productionCost) / customerPrice * 100);
  return {
    ...result,
    customerPrice,
    total: customerPrice,
    productionCost,
    contribution,
    marginPercent,
    minimumPriceApplied: result.minimumPriceApplied || minimumPriceApplied,
    marginGuardApplied: result.marginGuardApplied || marginGuardApplied,
    warnings
  };
}

export function legacyPricingResult(
  product: ProductCatalogItem,
  quantity: number,
  configuration: Record<string, string>,
  productionContext?: PricingProductionContext
): PricingResult {
  const legacy = calculateConfiguredProductPrice(product, quantity, configuration, productionContext);
  return {
    subtotal: legacy.total,
    discount: 0,
    customerPrice: legacy.total,
    total: legacy.total,
    components: [
      {
        id: "legacy",
        label: "Legacy pricing",
        quantity: legacy.baseQuantity,
        quantitySource: "copies",
        unitSellingPrice: legacy.baseUnitPrice,
        sellingTotal: legacy.total
      },
      ...legacy.lines.map((line, index) => ({
        id: `legacy-${index}`,
        label: line.label,
        quantity: line.quantity ?? legacy.propertyQuantity,
        quantitySource: "copies" as const,
        unitSellingPrice: line.unitPrice ?? 0,
        sellingTotal: line.price
      }))
    ]
  };
}

export function calculateProductPricingResult(params: {
  product: ProductCatalogItem;
  quantity: number;
  configuration: Record<string, string>;
  productionContext?: PricingProductionContext;
  globalProperties?: GlobalProperty[];
  discount?: number;
}): PricingResult {
  const qty = safeQuantity(params.quantity);
  const profile = profileConfig(params.product);
  const components = (profile?.components ?? []).filter((component) => component.enabled !== false);
  if (!profile || components.length === 0) {
    return legacyPricingResult(params.product, qty, params.configuration, params.productionContext);
  }

  const warnings: PricingWarning[] = [];
  const componentResults: PricingComponentResult[] = [];
  for (const component of components) {
    const quantity = resolvePricingQuantity({
      source: component.quantitySource,
      product: params.product,
      configuration: params.configuration,
      productionContext: params.productionContext,
      fallbackQuantity: qty
    });
    const prices = resolveUnitPrices(component, params.globalProperties ?? []);
    if (prices.sellingPrice === undefined) {
      warnings.push({ code: "missingPrice", message: `${component.label}: Verkaufspreis fehlt.`, componentId: component.id });
      continue;
    }
    if (quantity <= 0) {
      warnings.push({ code: "missingQuantity", message: `${component.label}: Menge ist 0.`, componentId: component.id });
    }
    componentResults.push({
      id: component.id,
      label: component.label,
      quantity,
      quantitySource: component.quantitySource,
      unitSellingPrice: money(prices.sellingPrice),
      unitCost: prices.costPrice === undefined ? undefined : money(prices.costPrice),
      sellingTotal: money(quantity * prices.sellingPrice),
      costTotal: prices.costPrice === undefined ? undefined : money(quantity * prices.costPrice)
    });
  }

  const subtotal = money(componentResults.reduce((sum, component) => sum + component.sellingTotal, 0));
  const discount = money(Math.max(0, Number(params.discount ?? 0) || 0));
  const customerPrice = money(Math.max(0, subtotal - discount));
  const costRows = componentResults.filter((component) => component.costTotal !== undefined);
  const productionCost = costRows.length ? money(costRows.reduce((sum, component) => sum + Number(component.costTotal ?? 0), 0)) : undefined;
  const contribution = productionCost === undefined ? undefined : money(customerPrice - productionCost);
  const marginPercent = productionCost === undefined || customerPrice <= 0 ? undefined : money((customerPrice - productionCost) / customerPrice * 100);
  const result: PricingResult = {
    subtotal,
    discount,
    customerPrice,
    total: customerPrice,
    productionCost,
    contribution,
    marginPercent,
    components: componentResults,
    warnings: warnings.length ? warnings : undefined
  };
  return applyGuards(result, profile.guards);
}
