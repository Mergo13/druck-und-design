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
    production?: ProductPropertyProductionMetadata;
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

export type ProductPropertyPriceMode = "global" | "included" | "fixed" | "tiered" | "flat" | "multiplier";

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
  multiplier?: number;
  tierPrices?: ProductPropertyTierPrice[];
  production?: ProductPropertyProductionMetadata;
};

export type ProductPropertyProductionMetadata = {
  thicknessMm?: number;
  caliperMm?: number;
  grammageGsm?: number;
  caliperSource?: "manufacturer" | "supplier" | "measured" | "estimated";
  coverThicknessMm?: number;
  bindingSystemId?: string;
  bindingSeries?: string;
  bindingColor?: string;
  format?: string;
  pricingQuantitySource?: "copies" | "printed_pages" | "sheets" | "black_white_pages" | "color_pages" | "front_covers" | "back_covers" | "per_order";
  printColorMode?: "black_white" | "full_color" | "auto";
};

export type PdfAnalysisMode = "disabled" | "optional" | "required";

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
  pricingMode?: Exclude<ProductPropertyPriceMode, "global">;
  fixedPrice?: number;
  multiplier?: number;
  tierPrices?: ProductPropertyTierPrice[];
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
  pdfAnalysisMode?: PdfAnalysisMode;
  productBindingConfig?: {
    enabledSystems?: string[];
    bindingSizeSelectionMode?: "automatic" | "manual" | "automatic-with-override";
  };
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
