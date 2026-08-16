import { getCategories, getGlobalProperties, getPublicProductBySlug } from "@/lib/catalog-repository";
import { calculateConfiguredProductPrice, calculateSelectedCategoryPropertiesPrice, calculateVariantPrice } from "@/lib/print-workflow";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { applyStudentDiscount, getStudentDiscountPercent, isVerifiedStudent } from "@/lib/student-discount";
import type { UserAccount } from "@/types";
import type { ProductCatalogItem, ProductCategoryProperty } from "@/types/print-platform";

type CartPricingInput = {
  slug: string;
  name?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  config?: Record<string, string>;
  pricingConfig?: Record<string, string>;
  printCheckRequested?: boolean;
  printCheckFee?: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
};

export type PricedCartItem = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  normalUnitPrice: number;
  lineNormalPrice: number;
  lineFinalPrice: number;
  config: Record<string, string>;
  pricingConfig: Record<string, string>;
  printCheckRequested: boolean;
  printCheckFee: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
  studentDiscount: {
    eligible: boolean;
    verified: boolean;
    percent: number;
    amount: number;
  };
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function safeLineQuantity(quantity: unknown) {
  const value = Number(quantity);
  return Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
}

function selectedOptionsFromItem(item: CartPricingInput) {
  const selectedOptions = { ...(item.pricingConfig ?? item.config ?? {}) };
  if (!selectedOptions.auflage && selectedOptions.Menge) selectedOptions.auflage = selectedOptions.Menge;
  return selectedOptions;
}

function configuredQuantity(selectedOptions: Record<string, string>) {
  return safeLineQuantity(selectedOptions.auflage ?? 1);
}

function enabledCategoryProperties(product: ProductCatalogItem, categoryProperties: ProductCategoryProperty[]) {
  if (product.pricingProperties?.length) return [];
  const enabled = new Set(product.enabledCategoryProperties ?? []);
  if (!enabled.size) return [];
  return categoryProperties.filter((property) => enabled.has(property.name) && property.values.length > 0);
}

function calculateProductUnitPrice(product: ProductCatalogItem, quantity: number, selectedOptions: Record<string, string>, categoryProperties: ProductCategoryProperty[]) {
  if (product.pricingType === "tiered" || product.pricingType === "area" || product.pricingProperties?.length) {
    return calculateConfiguredProductPrice(product, quantity, selectedOptions).total;
  }
  const firstVariant = product.variants[0];
  const productPrice = firstVariant
    ? calculateVariantPrice(product, firstVariant.id, quantity, selectedOptions)
    : product.basePrice;
  return money(productPrice + calculateSelectedCategoryPropertiesPrice(enabledCategoryProperties(product, categoryProperties), quantity, selectedOptions));
}

export async function priceCartItems(params: {
  items: CartPricingInput[];
  user?: Pick<UserAccount, "studentVerification"> | null;
  studentDiscountPercent?: number | null;
}) {
  const [categories, globalProperties] = await Promise.all([getCategories(), getGlobalProperties()]);
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const percent = getStudentDiscountPercent(params.studentDiscountPercent);
  const verified = isVerifiedStudent(params.user);
  const pricedItems: PricedCartItem[] = [];

  for (const item of params.items) {
    const rawProduct = await getPublicProductBySlug(item.slug);
    if (!rawProduct) throw new Error(`Produkt ${item.slug} ist nicht verfügbar.`);
    const product = resolveGlobalPropertyPricing(rawProduct, globalProperties);
    const pricingConfig = selectedOptionsFromItem(item);
    const productQuantity = configuredQuantity(pricingConfig);
    const lineQuantity = safeLineQuantity(item.quantity);
    const categoryProperties = categoriesBySlug.get(product.category)?.properties ?? [];
    const normalUnitPrice = calculateProductUnitPrice(product, productQuantity, pricingConfig, categoryProperties);
    const lineNormalPrice = money(normalUnitPrice * lineQuantity);
    const discountResult = applyStudentDiscount({ subtotal: lineNormalPrice, product, user: params.user, percent });
    const lineFinalPrice = discountResult.total;
    const unitPrice = money(lineFinalPrice / lineQuantity);
    pricedItems.push({
      slug: product.slug,
      name: product.name,
      category: product.category,
      quantity: lineQuantity,
      unitPrice,
      normalUnitPrice,
      lineNormalPrice,
      lineFinalPrice,
      config: item.config ?? {},
      pricingConfig,
      printCheckRequested: Boolean(item.printCheckRequested),
      printCheckFee: money(Number(item.printCheckFee ?? 0) || 0),
      printCheckFileName: item.printCheckFileName,
      printCheckFileUrl: item.printCheckFileUrl,
      studentDiscount: {
        eligible: product.studentDiscountEligible !== false,
        verified,
        percent,
        amount: discountResult.discounts.find((discount) => discount.type === "student")?.amount ?? 0
      }
    });
  }

  const subtotalBeforeDiscount = money(pricedItems.reduce((sum, item) => sum + item.lineNormalPrice, 0));
  const studentDiscountTotal = money(pricedItems.reduce((sum, item) => sum + item.studentDiscount.amount, 0));
  const subtotalAfterDiscount = money(pricedItems.reduce((sum, item) => sum + item.lineFinalPrice, 0));

  return {
    items: pricedItems,
    subtotalBeforeDiscount,
    studentDiscountTotal,
    subtotalAfterDiscount,
    studentVerified: verified,
    studentDiscountPercent: percent
  };
}
