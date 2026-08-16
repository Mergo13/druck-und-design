"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEmbossingLayout } from "@/lib/embossing/layout";
import { validateEmbossingLayout } from "@/lib/embossing/validation";
import { defaultCoverGeometry, defaultEmbossingProductionRules, type EmbossingColor, type EmbossingSourceContent, type EmbossingTemplate } from "@/lib/embossing/types";
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
  onFinalized
}: {
  productId: string;
  embossingColor: EmbossingColor;
  authenticated: boolean;
  currentEmbossingPrice: number;
  onFinalized: (design: FinalizedDesign | null) => void;
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = useMemo(() => generateEmbossingLayout({
    coverGeometry: defaultCoverGeometry,
    sourceContent,
    template,
    fontStyle,
    productionRules: defaultEmbossingProductionRules,
    advancedAdjustments: mode === "advanced" ? { middle: { offsetYMm: advancedOffset, alignment: "center" } } : undefined
  }), [advancedOffset, fontStyle, mode, sourceContent, template]);
  const preflight = useMemo(() => validateEmbossingLayout(layout, defaultEmbossingProductionRules), [layout]);

  useEffect(() => {
    onFinalized(null);
  }, [embossingColor, fontStyle, onFinalized, sourceContent, template]);

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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Prägung gestalten</p>
          <h3 className="text-lg font-black">Automatisch gestalten</h3>
          <p className="mt-1 text-xs text-slate-500">Die Vorschau zeigt Position und Größe der Prägung. Gold bzw. Silber am Bildschirm ist eine Simulation.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Schließen</Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Vorlage" value={template} onChange={(value) => setTemplate(value as EmbossingTemplate)} options={[["classic", "Klassisch"], ["modern", "Modern"], ["minimal", "Minimal"], ["logo", "Mit Logo"]]} />
            <Select label="Stil" value={fontStyle} onChange={(value) => setFontStyle(value as "modern" | "classic")} options={[["modern", "Modern"], ["classic", "Klassisch"]]} />
          </div>
          <Field label="Hochschule / Schule" value={sourceContent.institution ?? ""} onChange={(value) => updateField("institution", value)} />
          <Field label="Art der Arbeit" value={sourceContent.workType ?? ""} onChange={(value) => updateField("workType", value)} />
          <Field label="Titel" value={sourceContent.title ?? ""} onChange={(value) => updateField("title", value)} />
          <Field label="Untertitel" value={sourceContent.subtitle ?? ""} onChange={(value) => updateField("subtitle", value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Name" value={sourceContent.author ?? ""} onChange={(value) => updateField("author", value)} />
            <Field label="Jahr" value={sourceContent.year ?? ""} onChange={(value) => updateField("year", value)} />
          </div>
          <button
            type="button"
            className="text-left text-xs font-black uppercase tracking-[0.12em] text-amber-700 hover:underline"
            onClick={() => setSourceContent((current) => ({ ...current, customLines: [...(current.customLines ?? []), ""].slice(0, defaultEmbossingProductionRules.maxCustomLines) }))}
          >
            + Eigene Zeile hinzufügen
          </button>
          {(sourceContent.customLines ?? []).map((line, index) => (
            <Field
              key={index}
              label={`Eigene Zeile ${index + 1}`}
              value={line}
              onChange={(value) => setSourceContent((current) => {
                const customLines = [...(current.customLines ?? [])];
                customLines[index] = value;
                return { ...current, customLines };
              })}
            />
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
            <UploadCloud className="h-4 w-4 text-amber-700" />
            <span>Logo hochladen · SVG oder Vektor-PDF empfohlen</span>
            <input type="file" accept=".svg,.pdf,.png,image/svg+xml,application/pdf,image/png" className="sr-only" onChange={(event) => void uploadLogo(event.target.files?.[0])} />
          </label>
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
        <div>
          <div className="aspect-[210/297] w-full">
            <EmbossingCoverPreview layout={layout} color={embossingColor} />
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-black">Prägezeilen: {layout.lineCount}</p>
            <p className="mt-1 text-slate-600">Prägung: {formatEuro(currentEmbossingPrice)}</p>
            <p className="mt-1 text-slate-500">{saving ? "Speichert..." : "Entwurf automatisch gespeichert"}</p>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700">
      {label}
      <input className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
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
