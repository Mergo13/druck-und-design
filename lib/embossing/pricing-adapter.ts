export function embossingDesignConfigLines(params: {
  designId: string;
  color: string;
  template: string;
  lineCount: number;
  resolvedText?: string;
  productionPdfUrl?: string | null;
  previewUrl?: string | null;
}) {
  return {
    PraegungDesignId: params.designId,
    Prägung: params.color === "silber" ? "Silber" : params.color === "blind" ? "Blindprägung" : "Gold",
    Vorlage: params.template,
    Prägezeilen: String(params.lineCount),
    PraegungText: params.resolvedText || "-",
    ProduktionsPDF: params.productionPdfUrl || "-",
    PraegungVorschau: params.previewUrl || "-"
  };
}

export function resolvedEmbossingLineCountFromConfig(config?: Record<string, string>) {
  const raw = config?.["resolvedEmbossingLineCount"] ?? config?.["Prägezeilen"];
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
