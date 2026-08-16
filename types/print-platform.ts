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
  fromQuantity?: number;
  toQuantity?: number;
  price: number;
  unitPrice?: number;
};

export type ProductPropertyPriceMode = "included" | "fixed" | "tiered";

export type ProductPropertyTierPrice = {
  quantity: number;
  fromQuantity?: number;
  toQuantity?: number;
  price: number;
  unitPrice?: number;
};

export type ProductPropertyValue = {
  propertyValueId?: string;
  value: string;
  label?: string;
  labelOverride?: string;
  enabled?: boolean;
  defaultSelected?: boolean;
  sortOrder?: number;
  pricingMode: ProductPropertyPriceMode;
  fixedPrice?: number;
  tierPrices?: ProductPropertyTierPrice[];
};

export type ProductPricingProperty = {
  propertyId?: string;
  name: string;
  required?: boolean;
  sortOrder?: number;
  stepPrice?: number;
  values: ProductPropertyValue[];
};

export type GlobalPropertyValue = {
  id: string;
  value: string;
  label?: string;
  sortOrder: number;
  active: boolean;
};

export type GlobalProperty = {
  slug: string;
  name: string;
  active: boolean;
  sortOrder: number;
  values: GlobalPropertyValue[];
  usageCount?: number;
};

export type ShowroomImage = {
  image: string;
  title: string;
  description?: string;
};

export type SolutionGroup = {
  title: string;
  items: string[];
};

export type ProductIndustry = {
  slug: string;
  name: string;
  description: string;
  heroImage?: string;
  seoTitle?: string;
  metaDescription?: string;
  visible?: boolean;
  published?: boolean;
  sortOrder?: number;
  featured?: boolean;
  productSlugs?: string[];
  serviceLinks?: Array<{
    label: string;
    href: string;
  }>;
  solutionGroups?: SolutionGroup[];
  showroomImages?: ShowroomImage[];
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
  showroomImages?: ShowroomImage[];
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
  pricingType?: "fixed" | "tiered" | "area" | "hourly";
  areaPricing?: {
    defaultWidthCm?: number;
    defaultHeightCm?: number;
    minAreaM2?: number;
  };
  productStatus?: "draft" | "active" | "inactive";
  purchaseMode?: "online" | "request" | "both" | "disabled";
  isBestseller?: boolean;
  bestsellerSortOrder?: number;
  isStudentShop?: boolean;
  studentShopSortOrder?: number;
  studentDiscountEligible?: boolean;
  priceTiers?: ProductPriceTier[];
  pricingProperties?: ProductPricingProperty[];
  priceHistory?: Array<{
    changedAt: string;
    user?: string;
    summary: string;
  }>;
  deliveryText: string;
  tags: string[];
  variants: ProductVariant[];
  production: ProductionMetadata;
  quantitySteps?: number[];
  propertyTemplate?: string;
  enabledCategoryProperties?: string[];
  industrySlugs?: string[];
};

export type HomepageSettings = {
  bestsellerEnabled: boolean;
  bestsellerTitle: string;
  bestsellerSubtitle: string;
  bestsellerSortOrder: number;
  studentShopEnabled: boolean;
  studentShopTitle: string;
  studentShopDescription: string;
  studentShopImage: string;
  studentShopLink: string;
  studentShopSortOrder: number;
  googleReviewsEnabled: boolean;
  googleReviewsTitle: string;
  googleReviewsSubtitle: string;
  googleReviewsSortOrder: number;
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
