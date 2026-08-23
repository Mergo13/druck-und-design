"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Minus, Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { coverZones } from "@/lib/embossing/geometry";
import { generateEmbossingLayout } from "@/lib/embossing/layout";
import { getEffectiveFontSizeRange, getEmbossingFontRule, roleTypography } from "@/lib/embossing/typography";
import { validateEmbossingElement, validateEmbossingLayout } from "@/lib/embossing/validation";
import { defaultCoverGeometry, defaultEmbossingProductionRules, type EmbossingColor, type EmbossingResolvedLayout, type EmbossingSourceContent, type EmbossingTemplate, type EmbossingTextRole } from "@/lib/embossing/types";
import { formatEuro } from "@/lib/utils";
import { EmbossingCoverPreview } from "./embossing-cover-preview";

type FinalizedDesign = {
  id: string;
  cartConfig: Record<string, string>;
  lineCount: number;
  previewUrl?: string;
  productionPdfUrl?: string;
};

const defaultContent: EmbossingSourceContent = {
  institution: "FH Oberösterreich",
  workType: "Bachelorarbeit",
  title: "",
  subtitle: "",
  author: "",
  year: String(new Date().getFullYear()),
  customLines: []
};

export function EmbossingConfigurator({
  productId,
  embossingColor,
  authenticated,
  currentEmbossingPrice,
  onFinalized,
  onLineCountChange,
  presentation = "compact"
}: {
  productId: string;
  embossingColor: EmbossingColor;
  authenticated: boolean;
  currentEmbossingPrice: number;
  onFinalized: (design: FinalizedDesign | null) => void;
  onLineCountChange?: (lineCount: number) => void;
  presentation?: "compact" | "wide";
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"auto" | "advanced">("auto");
  const [template, setTemplate] = useState<EmbossingTemplate>("classic");
  const [fontStyle, setFontStyle] = useState<"modern" | "classic">("modern");
  const [sourceContent, setSourceContent] = useState<EmbossingSourceContent>(defaultContent);
  const [designId, setDesignId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState("");
  const [advancedOffset, setAdvancedOffset] = useState(0);
  const [selectedLine, setSelectedLine] = useState("title");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadedCoverLineCount = Math.max(0, Math.round(Number(sourceContent.coverUpload?.lineCount ?? 0)));

  const layout = useMemo(() => generateEmbossingLayout({
    coverGeometry: defaultCoverGeometry,
    sourceContent,
    template,
    fontStyle,
    productionRules: defaultEmbossingProductionRules,
    advancedAdjustments: mode === "advanced" ? { middle: { offsetYMm: advancedOffset, alignment: "center" } } : undefined
  }), [advancedOffset, fontStyle, mode, sourceContent, template]);
  const preflight = useMemo(() => validateEmbossingLayout(layout, defaultEmbossingProductionRules), [layout]);
  const effectiveLineCount = uploadedCoverLineCount || layout.lineCount;

  useEffect(() => {
    onFinalized(null);
  }, [advancedOffset, embossingColor, fontStyle, mode, onFinalized, sourceContent, template]);

  useEffect(() => {
    onLineCountChange?.(effectiveLineCount);
  }, [effectiveLineCount, onLineCountChange]);

  useEffect(() => {
    if (!open || !authenticated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 650);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [authenticated, open, sourceContent, template, fontStyle, advancedOffset, mode]);

  async function saveDraft() {
    setSaving(true);
    try {
      const response = await fetch("/api/embossing/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: designId,
          productId,
          embossingColor,
          template,
          fontStyle,
          coverGeometry: defaultCoverGeometry,
          sourceContent,
          advancedAdjustments: mode === "advanced" ? { middle: { offsetYMm: advancedOffset } } : undefined
        })
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.id) {
        setDesignId(payload.id);
        return String(payload.id);
      }
    } finally {
      setSaving(false);
    }
    return designId;
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/embossing/upload-logo", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({ message: "Logo-Upload fehlgeschlagen." }));
    if (!response.ok) {
      setMessage(payload.message ?? "Logo-Upload fehlgeschlagen.");
      return;
    }
    setSourceContent((current) => ({
      ...current,
      logo: {
        url: payload.url,
        name: payload.name,
        mimeType: payload.mimeType,
        widthMm: 42,
        heightMm: 18
      }
    }));
    setTemplate("logo");
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/embossing/upload-cover", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({ message: "Cover-Upload fehlgeschlagen." }));
    if (!response.ok) {
      setMessage(payload.message ?? "Cover-Upload fehlgeschlagen.");
      return;
    }
    const extractedLines = Array.isArray(payload.analysis?.extractedLines)
      ? payload.analysis.extractedLines.map((line: unknown) => String(line)).filter(Boolean)
      : [];
    const lineCount = Number(payload.analysis?.lineCount ?? 0);
    setSourceContent((current) => ({
      ...current,
      coverUpload: {
        url: payload.url,
        name: payload.name,
        mimeType: payload.mimeType,
        lineCount: Number.isFinite(lineCount) ? Math.max(0, Math.round(lineCount)) : 0,
        extractedLines,
        analysisMessage: payload.analysis?.analysisMessage
      }
    }));
    setMessage(payload.analysis?.analysisMessage ?? "Cover-Datei gespeichert.");
  }

  async function finalizeDesign() {
    if (!preflight.valid) {
      setMessage("Bitte korrigieren Sie die markierten Produktionshinweise.");
      return;
    }
    setFinalizing(true);
    setMessage("");
    try {
      const id = await saveDraft();
      if (!id) {
        setMessage("Entwurf konnte noch nicht gespeichert werden. Bitte erneut versuchen.");
        return;
      }
      const response = await fetch(`/api/embossing/designs/${id}/finalize`, { method: "POST" });
      const payload = await response.json().catch(() => ({ message: "Prägung konnte nicht abgeschlossen werden." }));
      if (!response.ok) {
        setMessage(payload.message ?? "Prägung konnte nicht abgeschlossen werden.");
        return;
      }
      onFinalized({
        id: payload.design.id,
        cartConfig: payload.cartConfig,
        lineCount: payload.design.lineCount,
        previewUrl: payload.design.previewUrl,
        productionPdfUrl: payload.design.productionPdfUrl
      });
      setMessage("✓ Prägung gespeichert");
    } finally {
      setFinalizing(false);
    }
  }

  function updateField(key: keyof EmbossingSourceContent, value: string) {
    setSourceContent((current) => ({ ...current, [key]: value }));
  }

  function updateFontSize(role: EmbossingTextRole, value: number, customIndex?: number) {
    const size = Math.round(value);
    setSourceContent((current) => {
      if (role === "custom" && typeof customIndex === "number") {
        const customFontSizeOverrides = [...(current.customFontSizeOverrides ?? [])];
        customFontSizeOverrides[customIndex] = size;
        return { ...current, customFontSizeOverrides };
      }
      return {
        ...current,
        fontSizeOverrides: {
          ...(current.fontSizeOverrides ?? {}),
          [role]: size
        }
      };
    });
  }

  if (!open) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-amber-950">Präge-Cover-Generator</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">Automatisch gestalten mit sicheren Bereichen, geprüften Fonts und finalen Prägezeilen.</p>
          </div>
          <Button type="button" size="sm" className="shrink-0 bg-amber-700 hover:bg-amber-800" onClick={() => setOpen(true)}>
            Prägung gestalten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={presentation === "wide" ? "rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-6" : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Prägung gestalten</p>
          <h3 className="text-lg font-black">Automatisch gestalten</h3>
          <p className="mt-1 text-xs text-slate-500">Die Vorschau zeigt Position und Größe der Prägung. Gold bzw. Silber am Bildschirm ist eine Simulation.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Schließen</Button>
      </div>

      <div className={presentation === "wide" ? "mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" : "mt-4 grid gap-4 lg:grid-cols-[1fr_180px]"}>
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Vorlage" value={template} onChange={(value) => setTemplate(value as EmbossingTemplate)} options={[["classic", "Klassisch"], ["modern", "Modern"], ["minimal", "Minimal"], ["logo", "Mit Logo"]]} />
            <Select label="Stil" value={fontStyle} onChange={(value) => setFontStyle(value as "modern" | "classic")} options={[["modern", "Modern"], ["classic", "Klassisch"]]} />
          </div>
          <TextLineEditor selected={selectedLine === "institution"} label="Hochschule / Schule" role="institution" value={sourceContent.institution ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("institution")} onChange={(value) => updateField("institution", value)} onFontSizeChange={(value) => updateFontSize("institution", value)} />
          <TextLineEditor selected={selectedLine === "workType"} label="Art der Arbeit" role="workType" value={sourceContent.workType ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("workType")} onChange={(value) => updateField("workType", value)} onFontSizeChange={(value) => updateFontSize("workType", value)} />
          <TextLineEditor selected={selectedLine === "title"} label="Titel" role="title" value={sourceContent.title ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("title")} onChange={(value) => updateField("title", value)} onFontSizeChange={(value) => updateFontSize("title", value)} />
          <TextLineEditor selected={selectedLine === "subtitle"} label="Untertitel" role="subtitle" value={sourceContent.subtitle ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("subtitle")} onChange={(value) => updateField("subtitle", value)} onFontSizeChange={(value) => updateFontSize("subtitle", value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <TextLineEditor selected={selectedLine === "author"} label="Name" role="author" value={sourceContent.author ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("author")} onChange={(value) => updateField("author", value)} onFontSizeChange={(value) => updateFontSize("author", value)} />
            <TextLineEditor selected={selectedLine === "year"} label="Jahr" role="year" value={sourceContent.year ?? ""} sourceContent={sourceContent} layout={layout} fontStyle={fontStyle} onFocus={() => setSelectedLine("year")} onChange={(value) => updateField("year", value)} onFontSizeChange={(value) => updateFontSize("year", value)} />
          </div>
          <button
            type="button"
            className="text-left text-xs font-black uppercase tracking-[0.12em] text-amber-700 hover:underline"
            onClick={() => setSourceContent((current) => ({ ...current, customLines: [...(current.customLines ?? []), ""].slice(0, defaultEmbossingProductionRules.maxCustomLines) }))}
          >
            + Eigene Zeile hinzufügen
          </button>
          {(sourceContent.customLines ?? []).map((line, index) => (
            <div key={index} className="grid gap-2">
              <Field
                label={`Eigene Zeile ${index + 1}`}
                value={line}
                onFocus={() => setSelectedLine(`custom-${index}`)}
                onChange={(value) => setSourceContent((current) => {
                  const customLines = [...(current.customLines ?? [])];
                  customLines[index] = value;
                  return { ...current, customLines };
                })}
              />
              {selectedLine === `custom-${index}` ? (
                <FontSizeControl
                  label={`Eigene Zeile ${index + 1}`}
                  role="custom"
                  value={line}
                  customIndex={index}
                  sourceContent={sourceContent}
                  layout={layout}
                  fontStyle={fontStyle}
                  onChange={(value) => updateFontSize("custom", value, index)}
                />
              ) : null}
            </div>
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
            <UploadCloud className="h-4 w-4 text-amber-700" />
            <span>Logo hochladen · SVG, AI, PDF oder PNG</span>
            <input type="file" accept=".svg,.ai,.pdf,.png,image/svg+xml,application/postscript,application/illustrator,application/pdf,image/png" className="sr-only" onChange={(event) => void uploadLogo(event.target.files?.[0])} />
          </label>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <label className="flex cursor-pointer items-center gap-3 text-xs font-semibold text-amber-950">
              <UploadCloud className="h-4 w-4 text-amber-700" />
              <span>Eigenes Cover hochladen · PDF, SVG, AI oder PNG</span>
              <input type="file" accept=".svg,.ai,.pdf,.png,image/svg+xml,application/postscript,application/illustrator,application/pdf,image/png" className="sr-only" onChange={(event) => void uploadCover(event.target.files?.[0])} />
            </label>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Bei PDF/SVG wird lesbarer Text analysiert. Wenn Text als Pfad oder Bild angelegt ist, trägst du die Prägezeilen manuell ein.
            </p>
            {sourceContent.coverUpload ? (
              <div className="mt-3 grid gap-2 rounded-md border border-amber-200 bg-white p-3 text-xs">
                <p className="font-black text-slate-900">{sourceContent.coverUpload.name ?? "Cover-Datei"} gespeichert</p>
                <p className="text-slate-600">{sourceContent.coverUpload.analysisMessage ?? "Cover-Datei wurde gespeichert."}</p>
                <label className="grid gap-1 font-bold text-slate-700">
                  Prägezeilen aus eigener Datei
                  <input
                    type="number"
                    min="1"
                    max="40"
                    step="1"
                    value={sourceContent.coverUpload.lineCount || ""}
                    onChange={(event) => {
                      const lineCount = Math.max(0, Math.round(Number(event.target.value) || 0));
                      setSourceContent((current) => ({
                        ...current,
                        coverUpload: current.coverUpload ? { ...current.coverUpload, lineCount } : current.coverUpload
                      }));
                    }}
                    placeholder="z.B. 3"
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                {sourceContent.coverUpload.extractedLines?.length ? (
                  <p className="text-slate-500">Erkannt: {sourceContent.coverUpload.extractedLines.slice(0, 4).join(" · ")}{sourceContent.coverUpload.extractedLines.length > 4 ? " ..." : ""}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSourceContent((current) => ({ ...current, coverUpload: undefined }))}
                >
                  Eigene Cover-Datei entfernen
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant={mode === "auto" ? "default" : "outline"} size="sm" onClick={() => setMode("auto")}>Automatisch</Button>
            <Button type="button" variant={mode === "advanced" ? "default" : "outline"} size="sm" onClick={() => setMode("advanced")}>Positionen anpassen</Button>
          </div>
          {mode === "advanced" ? (
            <label className="grid gap-2 text-xs font-bold text-slate-700">
              Titelgruppe höher / tiefer
              <input type="range" min="-18" max="18" step="1" value={advancedOffset} onChange={(event) => setAdvancedOffset(Number(event.target.value))} />
            </label>
          ) : null}
        </div>
        <div className={presentation === "wide" ? "xl:sticky xl:top-24 xl:h-fit" : ""}>
          <div className={presentation === "wide" ? "mx-auto aspect-[210/297] w-full max-w-[360px]" : "aspect-[210/297] w-full"}>
            <EmbossingCoverPreview layout={layout} color={embossingColor} />
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-black">Prägezeilen: {effectiveLineCount}</p>
            <p className="mt-1 text-slate-600">Prägung: {formatEuro(currentEmbossingPrice)}</p>
            <p className="mt-1 text-slate-500">{uploadedCoverLineCount ? "Zählung aus eigener Cover-Datei" : saving ? "Speichert..." : "Entwurf automatisch gespeichert"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
        {preflight.checks.map((check) => (
          <p key={check.code} className={check.passed ? "flex items-center gap-2 text-emerald-700" : "flex items-center gap-2 text-red-700"}>
            <CheckCircle2 className="h-3.5 w-3.5" /> {check.passed ? "✓" : "!"} {check.label}
          </p>
        ))}
        {layout.corrections.map((correction) => <p key={correction} className="text-amber-700">{correction}</p>)}
      </div>
      <Button type="button" className="mt-4 w-full bg-amber-700 hover:bg-amber-800" disabled={finalizing || !preflight.valid} onClick={() => void finalizeDesign()}>
        {finalizing ? "Erzeuge Produktionsdatei..." : "Gestaltung abschließen"}
      </Button>
      {message ? <p className={message.startsWith("✓") ? "mt-2 text-xs font-semibold text-emerald-700" : "mt-2 text-xs font-semibold text-red-600"}>{message}</p> : null}
    </div>
  );
}

function Field({ label, value, onChange, onFocus }: { label: string; value: string; onChange: (value: string) => void; onFocus?: () => void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700">
      {label}
      <input className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextLineEditor({
  selected,
  label,
  role,
  value,
  sourceContent,
  layout,
  fontStyle,
  onFocus,
  onChange,
  onFontSizeChange
}: {
  selected: boolean;
  label: string;
  role: EmbossingTextRole;
  value: string;
  sourceContent: EmbossingSourceContent;
  layout: EmbossingResolvedLayout;
  fontStyle: "modern" | "classic";
  onFocus: () => void;
  onChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Field label={label} value={value} onFocus={onFocus} onChange={onChange} />
      {selected ? (
        <FontSizeControl
          label={label}
          role={role}
          value={value}
          sourceContent={sourceContent}
          layout={layout}
          fontStyle={fontStyle}
          onChange={onFontSizeChange}
        />
      ) : null}
    </div>
  );
}

function FontSizeControl({
  label,
  role,
  value,
  customIndex,
  sourceContent,
  layout,
  fontStyle,
  onChange
}: {
  label: string;
  role: EmbossingTextRole;
  value: string;
  customIndex?: number;
  sourceContent: EmbossingSourceContent;
  layout: EmbossingResolvedLayout;
  fontStyle: "modern" | "classic";
  onChange: (value: number) => void;
}) {
  const matchingElements = layout.elements.filter((item) => item.type === "text" && item.role === role);
  const element = matchingElements[role === "custom" ? customIndex ?? 0 : 0];
  const rule = getEmbossingFontRule(role);
  const zones = coverZones(defaultCoverGeometry);
  const zone = role === "institution" ? "top" : role === "author" || role === "year" ? "bottom" : "middle";
  const rect = zones[zone];
  const maxWidthMm = rect.width * roleTypography[role].maxWidthRatio;
  const weight = role === "title" || role === "workType" ? 600 : 500;
  const maxHeightMm = element?.type === "text"
    ? Math.max(element.lineHeightMm, rect.y + rect.height - element.yMm)
    : rect.height;
  const range = getEffectiveFontSizeRange({
    text: value,
    role,
    maxWidthMm,
    maxHeightMm,
    fontStyle,
    fontWeight: weight
  });
  const currentSize = typeof customIndex === "number"
    ? sourceContent.customFontSizeOverrides?.[customIndex] ?? (element?.type === "text" ? element.fontSizePt : range.default)
    : sourceContent.fontSizeOverrides?.[role] ?? (element?.type === "text" ? element.fontSizePt : range.default);
  const current = Math.round(currentSize);
  const recommendationText = range.recommendedMax < rule.recommendedMax
    ? `Empfohlen für diesen Text: ${range.recommendedMin}-${range.recommendedMax} pt`
    : `Empfohlen: ${range.recommendedMin}-${range.recommendedMax} pt`;
  const isInvalid = current > range.max || current < range.min;
  const isRecommended = !isInvalid && current >= range.recommendedMin && current <= range.recommendedMax;
  const elementStatus = element?.type === "text" ? validateEmbossingElement(element, layout, defaultEmbossingProductionRules) : undefined;
  const statusText = isInvalid
    ? `Maximal ${range.max} pt für diesen Text.`
    : isRecommended
      ? "Optimale Schriftgröße"
      : current > range.recommendedMax
        ? "Produktionssicher, aber größer als empfohlen"
        : "Produktionssicher, aber kleiner als empfohlen";

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-black text-amber-950">Schriftgröße</p>
        <p className={isInvalid ? "font-black text-red-700" : isRecommended ? "font-black text-emerald-700" : "font-black text-amber-800"}>
          {current} pt · {isInvalid ? "Ungültig" : isRecommended ? "Empfohlen" : current > range.recommendedMax ? "Größer als empfohlen" : "Kleiner als empfohlen"}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-[36px_1fr_36px] items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label={`${label} kleiner`} disabled={current <= range.min} onClick={() => onChange(Math.max(range.min, current - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <div className="rounded-md border border-amber-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-900">{current} pt</div>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label={`${label} größer`} disabled={current >= range.max} onClick={() => onChange(Math.min(range.max, current + 1))}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <input
        aria-label={`Schriftgröße ${label}`}
        className="mt-3 w-full accent-amber-700"
        type="range"
        min={range.min}
        max={range.max}
        step="1"
        value={Math.min(current, range.max)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-1 flex justify-between text-[11px] font-bold text-amber-900">
        <span>{range.min} pt</span>
        <span>{range.max} pt</span>
      </div>
      <p className="mt-2 font-semibold text-amber-950">{recommendationText}</p>
      <div className="mt-2 grid gap-1">
        <p className={isInvalid ? "text-red-700" : isRecommended ? "text-emerald-700" : "text-amber-800"}>{isInvalid ? "✕" : isRecommended ? "✓" : "!"} {statusText}</p>
        {elementStatus ? (
          <p className={elementStatus.valid ? "text-emerald-700" : "text-red-700"}>{elementStatus.valid ? "✓ Passt in den Prägebereich" : `✕ ${elementStatus.issues[0]}`}</p>
        ) : null}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700">
      {label}
      <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, labelText]) => <option key={optionValue} value={optionValue}>{labelText}</option>)}
      </select>
    </label>
  );
}
