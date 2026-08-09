export type MainCategory = string;

export type ProductAttributeType = "select" | "number" | "boolean" | "text";

export type ProductAttributeOption = {
  value: string;
  label: string;
  priceModifier?: number;
  productionDaysModifier?: number;
};

export type ProductAttribute = {
  key: string;
  label: string;
  type: ProductAttributeType;
  required: boolean;
  options?: ProductAttributeOption[];
  defaultValue?: string | number | boolean;
};

export type QuantityRule = {
  min: number;
  max: number;
  step: number;
};

export type PriceRule = {
  key: string;
  label: string;
  type: "fixed" | "per-unit" | "multiplier";
  amount: number;
};

export type ProductionMetadata = {
  baseProductionDays: number;
  expressAvailable: boolean;
  sameDayCutoff?: string;
  preflightProfile: "standard-print" | "large-format" | "textile" | "mailing";
  renderPipeline: "pdf-x4" | "vector-first" | "dtf-textile" | "mailing-batch";
};

export type ProductVariant = {
  id: string;
  name: string;
  skuPrefix: string;
  attributes: ProductAttribute[];
  quantityRule: QuantityRule;
  priceRules: PriceRule[];
};

export type ProductCategoryProperty = {
  name: string;
  values: Array<string | {
    value: string;
    label?: string;
    basePrice?: number;
    stepPrice?: number;
  }>;
  basePrice?: number;
  stepPrice?: number;
};

export type ProductPriceTier = {
  quantity: number;
  price: number;
};

export type ProductPropertyPriceMode = "included" | "fixed" | "tiered";

export type ProductPropertyTierPrice = {
  quantity: number;
  price: number;
};

export type ProductPropertyValue = {
  value: string;
  pricingMode: ProductPropertyPriceMode;
  fixedPrice?: number;
  tierPrices?: ProductPropertyTierPrice[];
};

export type ProductPricingProperty = {
  name: string;
  stepPrice?: number;
  values: ProductPropertyValue[];
};

export type ProductCategory = {
  slug: MainCategory;
  name: string;
  description: string;
  visible?: boolean;
  published?: boolean;
  quantitySteps?: number[];
  defaultPropertyTemplate?: string;
  logo?: string;
  properties?: ProductCategoryProperty[];
};

export type ProductCatalogItem = {
  slug: string;
  name: string;
  category: MainCategory;
  visible?: boolean;
  published?: boolean;
  short: string;
  description: string;
  seo: string;
  heroImage: string;
  gallery: string[];
  rating: number;
  basePrice: number;
  pricingType?: "fixed" | "tiered";
  productStatus?: "draft" | "active" | "inactive";
  priceTiers?: ProductPriceTier[];
  pricingProperties?: ProductPricingProperty[];
  deliveryText: string;
  tags: string[];
  variants: ProductVariant[];
  production: ProductionMetadata;
  quantitySteps?: number[];
  propertyTemplate?: string;
  enabledCategoryProperties?: string[];
};

export type FileCheckResult = {
  filename: string;
  valid: boolean;
  checks: Array<{ code: string; label: string; passed: boolean; hint?: string }>;
  metrics?: {
    fileSizeMb: number;
    extension: string;
    mimeType?: string;
    widthPx?: number;
    heightPx?: number;
    totalPixels?: number;
    estimatedDpi?: number;
    colorModelHint?: "RGB" | "CMYK" | "Unknown";
    targetFormat?: string;
  };
  aiAdvice?: string;
};

export type CustomerProject = {
  id: string;
  customerId: string;
  productSlug: string;
  variantId: string;
  designTemplateId?: string;
  latestExportPath?: string;
  status: "entwurf" | "in-pruefung" | "freigegeben" | "produktion";
  updatedAt: string;
};

export type AutomationJob = {
  id: string;
  type: "preflight" | "render" | "erp-sync" | "nextcloud-upload";
  status: "queued" | "running" | "done" | "failed";
  payload: Record<string, string | number | boolean>;
};
