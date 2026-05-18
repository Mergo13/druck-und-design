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

export type ProductCategory = {
  slug: MainCategory;
  name: string;
  description: string;
  quantitySteps?: number[];
  defaultPropertyTemplate?: string;
};

export type ProductCatalogItem = {
  slug: string;
  name: string;
  category: MainCategory;
  short: string;
  description: string;
  seo: string;
  heroImage: string;
  gallery: string[];
  rating: number;
  basePrice: number;
  deliveryText: string;
  tags: string[];
  variants: ProductVariant[];
  production: ProductionMetadata;
  quantitySteps?: number[];
  propertyTemplate?: string;
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
