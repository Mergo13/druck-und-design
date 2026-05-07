import type { AutomationJob, FileCheckResult, ProductCatalogItem } from "@/types/print-platform";

export function calculateVariantPrice(product: ProductCatalogItem, variantId: string, quantity: number, selectedOptions: Record<string, string>) {
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const base = variant.priceRules.find((rule) => rule.key === "basis")?.amount ?? product.basePrice;
  const unit = variant.priceRules.find((rule) => rule.key === "auflage")?.amount ?? 0;
  const optionPrice = variant.attributes.reduce((sum, attribute) => {
    const selected = selectedOptions[attribute.key];
    const match = attribute.options?.find((option) => option.value === selected);
    return sum + (match?.priceModifier ?? 0);
  }, 0);
  return Math.round((base + unit * quantity + optionPrice) * 100) / 100;
}

export function runMockPreflight(filename: string): FileCheckResult {
  const lower = filename.toLowerCase();
  const isPdf = lower.endsWith(".pdf");
  const checks = [
    { code: "format", label: "Dateiformat unterstützt", passed: isPdf, hint: isPdf ? undefined : "Bevorzugt wird PDF/X-4." },
    { code: "resolution", label: "Auflösung 300 dpi oder höher", passed: true },
    { code: "bleed", label: "Beschnitt vorhanden", passed: true }
  ];
  return { filename, valid: checks.every((item) => item.passed), checks };
}

export function createAutomationJobs(projectId: string): AutomationJob[] {
  return [
    { id: `job-preflight-${projectId}`, type: "preflight", status: "queued", payload: { projectId } },
    { id: `job-render-${projectId}`, type: "render", status: "queued", payload: { projectId } },
    { id: `job-erp-sync-${projectId}`, type: "erp-sync", status: "queued", payload: { projectId } },
    { id: `job-nextcloud-${projectId}`, type: "nextcloud-upload", status: "queued", payload: { projectId } }
  ];
}
