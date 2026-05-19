"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, ChevronDown, FileCheck, FileImage, Sparkles, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateVariantPrice } from "@/lib/print-workflow";
import { formatEuro } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductCatalogItem } from "@/types/print-platform";

const acceptedExtensions = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".svg", ".eps"];
const maxFileSize = 50 * 1024 * 1024;

export function ProductConfigurator({ product }: { product: ProductCatalogItem }) {
  const firstVariant = product.variants[0];
  const productOptions = useMemo(() => {
    if (!firstVariant) return [];
    return firstVariant.attributes
      .filter((attribute) => attribute.type === "select")
      .map((attribute) => ({
        label: attribute.label,
        key: attribute.key,
        values: (attribute.options ?? []).map((option) => option.label)
      }));
  }, [firstVariant]);

  const quantityOptions = useMemo(() => {
    if (!firstVariant) return ["100", "250", "500", "1.000"];
    const steps = product.quantitySteps ?? [firstVariant.quantityRule.min, firstVariant.quantityRule.max];
    return steps
      .filter((step) => Number.isFinite(step) && step > 0)
      .sort((a, b) => a - b)
      .map((step) => step.toLocaleString("de-DE"));
  }, [firstVariant, product]);

  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (firstVariant) {
      for (const attribute of firstVariant.attributes) {
        if (attribute.type !== "select") continue;
        const selected = attribute.options?.find((option) => option.value === attribute.defaultValue);
        initial[attribute.label] = selected?.label ?? attribute.options?.[0]?.label ?? "";
      }
      initial.Auflage = (product.quantitySteps?.[0] ?? firstVariant.quantityRule.min ?? 1).toLocaleString("de-DE");
    }
    return initial;
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [preflightMessage, setPreflightMessage] = useState("Live-Vorschau und Datencheck starten nach dem Upload.");
  const [preflightDetails, setPreflightDetails] = useState<Array<{ code: string; label: string; passed: boolean; hint?: string }>>([]);
  const [metrics, setMetrics] = useState<{
    fileSizeMb: number;
    extension: string;
    mimeType?: string;
    widthPx?: number;
    heightPx?: number;
    totalPixels?: number;
    estimatedDpi?: number;
    colorModelHint?: "RGB" | "CMYK" | "Unknown";
    targetFormat?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    return () => {
      if (mockupUrl) URL.revokeObjectURL(mockupUrl);
    };
  }, [mockupUrl]);

  async function validateAndSetFile(file?: File) {
    setUploadError("");
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAllowed = acceptedExtensions.some((extension) => fileName.endsWith(extension));

    if (!isAllowed) {
      setUploadedFile(null);
      setUploadError("Bitte laden Sie eine PDF-, AI-, PSD-, EPS-, PNG-, JPG-, TIFF- oder WebP-Datei hoch.");
      return;
    }

    if (file.size > maxFileSize) {
      setUploadedFile(null);
      setUploadError("Die Datei ist zu groß. Für die Demo sind maximal 50 MB erlaubt.");
      return;
    }

    setUploadedFile(file);
    let widthPx: number | undefined;
    let heightPx: number | undefined;

    // Fix: Clear previous errors and preflight data when a new file is valid
    setPreflightDetails([]);
    setMetrics(null);

    if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "tif", "tiff", "webp"].some(ext => fileName.endsWith(ext))) {
      try {
        setMockupUrl(URL.createObjectURL(file));
        const dimensions = await getImageDimensions(file);
        widthPx = dimensions?.width;
        heightPx = dimensions?.height;
      } catch (err) {
        console.error("Failed to get image dimensions", err);
      }
    } else {
      if (mockupUrl) URL.revokeObjectURL(mockupUrl);
      setMockupUrl("");
    }

    setPreflightStatus("running");
    setPreflightMessage("Preflight läuft...");
    const response = await fetch("/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        widthPx,
        heightPx,
        targetFormat: config.Format || config.format || "DIN A5",
        colorModelHint: (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "tif", "tiff", "webp"].some(ext => fileName.endsWith(ext))) ? "RGB" : "Unknown"
      })
    });
    const result = await response.json() as {
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
    setPreflightDetails(result.checks);
    setMetrics(result.metrics ?? null);
    if (result.valid) {
      setPreflightStatus("ok");
      setPreflightMessage(result.aiAdvice || `Preflight bestanden: ${result.checks.filter((item) => item.passed).length}/${result.checks.length} Checks OK.`);
    } else {
      setPreflightStatus("error");
      setPreflightMessage(result.aiAdvice || "Preflight fehlgeschlagen. Bitte Datei prüfen.");
    }
  }

  const price = useMemo(() => {
    if (firstVariant) {
      const quantity = Number(config.Auflage.replaceAll(".", "")) || firstVariant.quantityRule.min;
      const selectedAttributes = firstVariant.attributes.reduce<Record<string, string>>((acc, attribute) => {
        if (attribute.type !== "select") return acc;
        const selectedLabel = config[attribute.label];
        const selectedOption = (attribute.options ?? []).find((option) => option.label === selectedLabel);
        if (selectedOption) acc[attribute.key] = selectedOption.value;
        return acc;
      }, {});
      return calculateVariantPrice(product, firstVariant.id, quantity, selectedAttributes);
    }
    return product.basePrice;
  }, [config, firstVariant, product]);

  return (
    <aside className="sticky top-24 rounded-lg border bg-white p-5 shadow-premium lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Live-Konfigurator</p>
          <h2 className="text-2xl font-black">{formatEuro(price)}</h2>
          <p className="text-sm text-muted-foreground">inkl. Datencheck, zzgl. Versand</p>
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-right text-xs font-semibold">
          <CalendarCheck className="ml-auto h-4 w-4 text-primary" />
          {config.Lieferzeit === "Same Day" || config.Lieferzeit === "sameday" ? "Heute versandbereit" : "Lieferung in 2-5 Tagen"}
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {[...productOptions, { label: "Auflage", key: "auflage", values: quantityOptions }].map(({ label, values }) => (
          <label className="grid gap-2" key={label}>
            <span className="text-sm font-bold">{label}</span>
            <select
              suppressHydrationWarning
              value={config[label]}
              onChange={(event) => setConfig({ ...config, [label]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
            </select>
          </label>
        ))}
      </div>
      <label
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          validateAndSetFile(event.dataTransfer.files[0]);
        }}
        className={isDragging ? "mt-6 block cursor-pointer rounded-lg border border-dashed border-brand-blue bg-brand-mist p-5 text-center ring-2 ring-brand-blue/20" : "mt-6 block cursor-pointer rounded-lg border border-dashed bg-muted/40 p-5 text-center transition hover:border-brand-blue hover:bg-brand-mist"}
      >
        <input
          suppressHydrationWarning
          type="file"
          className="sr-only"
          accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff,image/x-adobe-photoshop,application/postscript"
          onChange={(event) => validateAndSetFile(event.target.files?.[0])}
        />
        <UploadCloud className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-2 text-sm font-bold">{uploadedFile ? uploadedFile.name : "Druckdaten hochladen"}</p>
        <p className="text-xs text-muted-foreground">Klicken oder Datei hier ablegen. PDF, AI, PSD, PNG, JPG oder TIFF bis 50 MB.</p>
        {uploadedFile && (
          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] uppercase tracking-wider"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUploadedFile(null);
                setPreflightStatus("idle");
                setPreflightMessage("Live-Vorschau und Datencheck starten nach dem Upload.");
                setPreflightDetails([]);
                setMetrics(null);
                if (mockupUrl) URL.revokeObjectURL(mockupUrl);
                setMockupUrl("");
              }}
            >
              Datei entfernen
            </Button>
          </div>
        )}
      </label>
      {(uploadError || preflightStatus === "error") && (
        <div className="mt-4 flex flex-col gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {uploadError || "Fehler in den Druckdaten"}
          </div>
          {preflightMessage && preflightStatus === "error" && (
            <p className="text-xs opacity-90 leading-relaxed italic">{preflightMessage}</p>
          )}
        </div>
      )}
      {mockupUrl ? (
        <div className="mt-4 overflow-hidden rounded-md border bg-slate-50">
          <img src={mockupUrl} alt="Live Mockup Vorschau" className="h-44 w-full object-cover" />
          <div className="border-t p-2 text-xs font-semibold text-slate-700">Live Mockup Vorschau</div>
        </div>
      ) : uploadedFile ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
          <FileImage className="h-4 w-4" />
          Dateityp ohne Bildvorschau ({uploadedFile.name})
        </div>
      ) : null}
      {preflightStatus === "ok" && (
        <div className="mt-4 flex flex-col gap-2 rounded-md bg-teal-50 p-4 text-sm text-teal-900 border border-teal-200">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4" /> Datencheck OK
          </div>
          <p className="leading-relaxed">{preflightMessage}</p>
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/40">
            <Sparkles className="h-3 w-3" /> KI-Assistent Analyse
          </div>
        </div>
      )}
      {preflightStatus === "idle" && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700 border">
          <FileCheck className="h-4 w-4" /> Preflight
        </div>
      )}
      {preflightStatus === "running" && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 animate-pulse">
          <FileCheck className="h-4 w-4" /> Preflight läuft...
        </div>
      )}
      {metrics && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex w-full items-center justify-between rounded-md border bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <span>Technische Messwerte</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`} />
          </button>
          {showTechnicalDetails && (
            <div className="mt-1 grid grid-cols-2 gap-2 rounded-md border bg-white p-3 text-[10px] text-slate-600">
              <p>Datei: {metrics.extension.toUpperCase()}</p>
              <p>Größe: {metrics.fileSizeMb} MB</p>
              <p>Pixel: {metrics.widthPx ?? "-"} x {metrics.heightPx ?? "-"}</p>
              <p>DPI: {metrics.estimatedDpi ?? "-"}</p>
              <p>Farbmodell: {metrics.colorModelHint ?? "-"}</p>
              <p>Format: {metrics.targetFormat ?? "-"}</p>
            </div>
          )}
        </div>
      )}
      {preflightDetails.length > 0 && showTechnicalDetails && (
        <div className="mt-3 rounded-md border p-3 text-[10px]">
          <p className="font-bold">Qualitätschecks</p>
          <div className="mt-2 grid gap-1">
            {preflightDetails.map((item) => (
              <div key={item.code} className={`flex items-center gap-2 ${item.passed ? "text-emerald-700" : "text-red-700"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="flex-1">{item.label}</span>
                <span>{item.passed ? "OK" : "Error"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button
        className="mt-6 w-full"
        size="lg"
        onClick={() => addItem({ id: crypto.randomUUID(), productSlug: product.slug, name: product.name, quantity: 1, price, config: { ...config, Druckdaten: uploadedFile?.name ?? "Upload folgt später" }, mockupUrl: mockupUrl || undefined, preflightPassed: preflightStatus === "ok" })}
      >
        In den Warenkorb
      </Button>
      <Button variant="outline" className="mt-3 w-full">Konfiguration speichern</Button>
    </aside>
  );
}

async function getImageDimensions(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}
