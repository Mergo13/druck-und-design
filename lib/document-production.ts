export type PrintSideMode = "simplex" | "duplex";

export function numericConfigValue(config: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const raw = config[key];
    if (!raw) continue;
    const match = String(raw).replace(",", ".").match(/\d+(\.\d+)?/);
    const value = Number(match?.[0] ?? NaN);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 0;
}

export function resolvePrintSides(config: Record<string, string>): PrintSideMode {
  const joined = Object.entries(config)
    .filter(([key]) => /druckseiten|druckseite|print|seite/i.test(key))
    .map(([, value]) => value)
    .join(" ")
    .toLowerCase();
  return /beidseitig|duplex|doppelseitig/.test(joined) ? "duplex" : "simplex";
}

export function deriveDocumentProduction(config: Record<string, string>, quantity: number) {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
  const pagesPerCopy = numericConfigValue(config, ["seitenanzahl", "Seitenanzahl", "Seiten pro Exemplar", "PDF-Seiten", "manualPageCount"]);
  const printSides = resolvePrintSides(config);
  const sheetsPerCopy = pagesPerCopy > 0
    ? printSides === "duplex" ? Math.ceil(pagesPerCopy / 2) : pagesPerCopy
    : 0;
  return {
    pagesPerCopy,
    quantity: safeQuantity,
    printSides,
    totalPrintedPages: pagesPerCopy * safeQuantity,
    sheetsPerCopy,
    totalSheets: sheetsPerCopy * safeQuantity
  };
}

export function pricingQuantitiesForDocument(config: Record<string, string>, quantity: number) {
  const production = deriveDocumentProduction(config, quantity);
  return production.pagesPerCopy > 0
    ? { baseQuantity: production.totalPrintedPages, propertyQuantity: production.quantity }
    : undefined;
}
