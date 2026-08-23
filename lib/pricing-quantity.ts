import type { PricingQuantitySource, ProductCatalogItem } from "@/types/print-platform";

export type PricingQuantityInput = {
  source: PricingQuantitySource;
  product?: ProductCatalogItem;
  configuration?: Record<string, string>;
  pdfAnalysis?: unknown;
  productionContext?: PricingProductionContext;
  fallbackQuantity?: number;
};

export type PricingProductionContext = {
  baseQuantity?: number;
  propertyQuantity?: number;
  copies?: number;
  printedPages?: number;
  sheets?: number;
  blackWhitePages?: number;
  colorPages?: number;
  frontCovers?: number;
  backCovers?: number;
  printedCoverSides?: number;
  embossingLines?: number;
  perOrder?: number;
  areaM2?: number;
  perimeterM?: number;
  runningMeter?: number;
  machineSheets?: number;
  finishedUnits?: number;
  cuts?: number;
  folds?: number;
  holes?: number;
  finishingPasses?: number;
  machineMinutes?: number;
  laborMinutes?: number;
  designHours?: number;
};

function positive(value: unknown, fallback: number) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
}

function areaDimension(value: unknown, fallback: number, min?: number, max?: number) {
  const numeric = positive(value, fallback);
  const minValue = Number(min);
  const maxValue = Number(max);
  const lowerBounded = Number.isFinite(minValue) && minValue > 0 ? Math.max(numeric, minValue) : numeric;
  return Number.isFinite(maxValue) && maxValue > 0 ? Math.min(lowerBounded, maxValue) : lowerBounded;
}

export function resolveAreaM2(product: ProductCatalogItem | undefined, configuration: Record<string, string> = {}) {
  const pricing = product?.areaPricing;
  const widthCm = areaDimension(configuration.areaWidthCm, pricing?.defaultWidthCm || 100, pricing?.minWidthCm, pricing?.maxWidthCm);
  const heightCm = areaDimension(configuration.areaHeightCm, pricing?.defaultHeightCm || 100, pricing?.minHeightCm, pricing?.maxHeightCm);
  const rawArea = Math.max(0, widthCm) * Math.max(0, heightCm) / 10000;
  return Math.round(Math.max(rawArea, Number(pricing?.minAreaM2 || 0)) * 10000) / 10000;
}

export function resolvePerimeterM(product: ProductCatalogItem | undefined, configuration: Record<string, string> = {}) {
  const pricing = product?.areaPricing;
  const widthCm = areaDimension(configuration.areaWidthCm, pricing?.defaultWidthCm || 100, pricing?.minWidthCm, pricing?.maxWidthCm);
  const heightCm = areaDimension(configuration.areaHeightCm, pricing?.defaultHeightCm || 100, pricing?.minHeightCm, pricing?.maxHeightCm);
  return Math.round(((widthCm + heightCm) * 2 / 100) * 10000) / 10000;
}

export function resolvePricingQuantity({
  source,
  product,
  configuration = {},
  productionContext,
  fallbackQuantity = 1
}: PricingQuantityInput) {
  const contextValue = source === "copies" ? productionContext?.copies
    : source === "printed_pages" ? productionContext?.printedPages
      : source === "sheets" ? productionContext?.sheets
        : source === "black_white_pages" ? productionContext?.blackWhitePages
          : source === "color_pages" ? productionContext?.colorPages
            : source === "front_covers" ? productionContext?.frontCovers
              : source === "back_covers" ? productionContext?.backCovers
                : source === "printed_cover_sides" ? productionContext?.printedCoverSides
                  : source === "embossing_lines" ? productionContext?.embossingLines
                    : source === "per_order" ? productionContext?.perOrder
                      : source === "area_m2" ? productionContext?.areaM2 ?? resolveAreaM2(product, configuration)
                        : source === "perimeter_m" ? productionContext?.perimeterM ?? resolvePerimeterM(product, configuration)
                          : source === "running_meter" ? productionContext?.runningMeter
                            : source === "machine_sheets" ? productionContext?.machineSheets
                              : source === "finished_units" ? productionContext?.finishedUnits
                                : source === "cuts" ? productionContext?.cuts
                                  : source === "folds" ? productionContext?.folds
                                    : source === "holes" ? productionContext?.holes
                                      : source === "finishing_passes" ? productionContext?.finishingPasses
                                        : source === "machine_minutes" ? productionContext?.machineMinutes
                                          : source === "labor_minutes" ? productionContext?.laborMinutes
                                            : source === "design_hours" ? productionContext?.designHours
                                              : fallbackQuantity;
  return positive(contextValue, fallbackQuantity);
}
