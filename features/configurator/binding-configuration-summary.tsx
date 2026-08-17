import type { BindingResolutionResult } from "@/lib/binding-resolution";

export function BindingConfigurationSummary({ result }: { result: BindingResolutionResult | null }) {
  if (!result) return null;

  if (result.status === "unsupported") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
        <p className="font-black text-amber-950">{result.bindingSystemLabel}</p>
        <p className="mt-1 text-amber-900">
          {result.reason === "missing-paper-thickness"
            ? "Für diese Bindung fehlt die Papierstärke. Bitte Produktionsdaten beim Papierwert pflegen."
            : result.reason === "color-unavailable"
              ? "Die automatisch passende Bindungsgröße ist in der gewählten Farbe nicht verfügbar."
              : result.reason === "block-too-thick"
                ? "Diese Bindung ist für die aktuelle Dokumentstärke nicht verfügbar."
                : "Lade eine PDF hoch oder gib die Seitenanzahl ein, damit die Bindungsgröße automatisch berechnet wird."}
        </p>
      </div>
    );
  }

  return (
    <details className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
      <summary className="cursor-pointer font-black">
        {result.bindingSystemLabel}: passende Bindungsgröße automatisch gewählt
      </summary>
      <div className="mt-2 grid gap-1 text-emerald-900">
        <p>{result.sizeLabel}{result.color ? ` · ${result.color}` : ""}{result.pitch ? ` · ${result.pitch}` : ""}</p>
        <p>{result.sheetCount} Blatt · {result.blockThicknessMm.toLocaleString("de-DE")} mm Blockstärke</p>
        {result.spineWidthMm ? <p>Rücken: {result.spineWidthMm.toLocaleString("de-DE")} mm</p> : null}
        {result.equivalentReferenceSheets ? (
          <p>{result.equivalentReferenceSheets.toLocaleString("de-DE")} Referenz-Blatt{result.estimated ? " (geschätzt)" : ""}</p>
        ) : null}
        {result.ringCount ? <p>{result.ringCount} Ringe</p> : null}
        {result.variantId ? <p>Produktionsvariante verfügbar</p> : null}
      </div>
    </details>
  );
}
