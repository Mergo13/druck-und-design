"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, ChevronDown, FileCheck, FileImage, Sparkles, UploadCloud, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateSelectedCategoryPropertiesPrice, calculateVariantPrice } from "@/lib/print-workflow";
import { formatEuro } from "@/lib/utils";
import type { ProductCatalogItem, ProductCategoryProperty } from "@/types/print-platform";

const acceptedExtensions = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".svg", ".eps"];
const maxFileSize = 50 * 1024 * 1024;
const fixedQuantitySteps = [1, 10, 100, 1000, 2500, 5000, 10000];
const PRINT_CHECK_FEE = Number(process.env.NEXT_PUBLIC_PRINT_CHECK_FEE_EUR ?? "9.99");

export function ProductConfigurator({ product, authenticated }: { product: ProductCatalogItem; authenticated: boolean }) {
  const router = useRouter();
  const firstVariant = product.variants[0];
  const productOptions = useMemo(() => {
    if (!firstVariant) return [];
    return firstVariant.attributes
      .filter((attribute) => attribute.type === "select")
      .map((attribute) => ({ label: attribute.label, key: attribute.key, options: attribute.options ?? [] }));
  }, [firstVariant]);

  const quantityOptions = useMemo(() => {
    return fixedQuantitySteps.map((step) => ({
      value: String(step),
      label: step.toLocaleString("de-DE")
    }));
  }, []);

  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (firstVariant) {
      for (const attribute of firstVariant.attributes) {
        if (attribute.type !== "select") continue;
        const selected = attribute.options?.find((option) => option.value === attribute.defaultValue);
        initial[attribute.key] = selected?.value ?? attribute.options?.[0]?.value ?? "";
      }
      initial.auflage = String(fixedQuantitySteps[0]);
    }
    return initial;
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [preflightMessage, setPreflightMessage] = useState("Die KI-gestützte Live-Analyse startet nach dem Dateiupload.");
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
  const [cartMessage, setCartMessage] = useState("");
  const [printCheckRequested, setPrintCheckRequested] = useState(false);
  const [categoryProperties, setCategoryProperties] = useState<ProductCategoryProperty[]>([]);
  const currentQuantity = Number(config.auflage ?? fixedQuantitySteps[0]);

  useEffect(() => {
    return () => {
      if (mockupUrl) URL.revokeObjectURL(mockupUrl);
    };
  }, [mockupUrl]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/catalog/categories");
        if (!res.ok) return;
        const categories = await res.json() as Array<{ slug: string; properties?: ProductCategoryProperty[] }>;
        const category = categories.find((entry) => entry.slug === product.category);
        setCategoryProperties(category?.properties ?? []);
      } catch {
        setCategoryProperties([]);
      }
    })();
  }, [product.category]);

  const enabledProperties = useMemo(() => {
    const enabled = new Set(product.enabledCategoryProperties ?? []);
    if (!enabled.size) return [];
    return categoryProperties.filter((property) => enabled.has(property.name) && property.values.length > 0);
  }, [categoryProperties, product.enabledCategoryProperties]);
  const currentPrice = useMemo(() => {
    const quantity = Number.isFinite(currentQuantity) ? currentQuantity : 1;
    const productPrice = firstVariant
      ? calculateVariantPrice(product, firstVariant.id, quantity, config)
      : product.basePrice;
    return Math.round((productPrice + calculateSelectedCategoryPropertiesPrice(enabledProperties, quantity, config)) * 100) / 100;
  }, [config, currentQuantity, enabledProperties, firstVariant, product]);

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
      setPreflightMessage(result.aiAdvice || "Die KI hat Ihre Daten als produktionsreif eingestuft.");
    } else {
      setPreflightStatus("error");
      setPreflightMessage(result.aiAdvice || "Die KI-Analyse hat kritische Fehler festgestellt, die das Druckergebnis beeinträchtigen könnten.");
    }
  }

  async function uploadPrintFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads/print-file", { method: "POST", body: formData });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Datei-Upload fehlgeschlagen." }));
      throw new Error(payload.message ?? "Datei-Upload fehlgeschlagen.");
    }
    return response.json() as Promise<{ url: string; name: string; size?: number; mimeType?: string }>;
  }

  async function addToCart() {
    if (printCheckRequested && !uploadedFile) {
      setCartMessage("Für den Profi-Print-Check bitte zuerst eine Datei hochladen.");
      return false;
    }
    if (printCheckRequested && preflightStatus !== "ok" && preflightStatus !== "error") {
      setCartMessage("Bitte warten, bis der Datei-Check abgeschlossen ist.");
      return false;
    }

    const existing = JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<{
      slug: string;
      name: string;
      quantity: number;
      category: string;
      unitPrice?: number;
      printCheckRequested?: boolean;
      printCheckFee?: number;
      printCheckFileName?: string;
      printCheckFileUrl?: string;
      printCheckStatus?: "ok" | "error" | "idle";
    }>;

    let uploadedUrl: string | undefined;
    if (printCheckRequested && uploadedFile) {
      try {
        const uploaded = await uploadPrintFile(uploadedFile);
        uploadedUrl = uploaded.url;
      } catch (error) {
        setCartMessage(error instanceof Error ? error.message : "Datei-Upload fehlgeschlagen.");
        return false;
      }
    }

    const merged = [...existing];
    const found = merged.find((entry) => entry.slug === product.slug);
    if (found) {
      found.quantity += 1;
      if (printCheckRequested) {
        found.printCheckRequested = true;
        found.printCheckFee = PRINT_CHECK_FEE;
        found.printCheckFileName = uploadedFile?.name ?? found.printCheckFileName;
        found.printCheckFileUrl = uploadedUrl ?? found.printCheckFileUrl;
        found.printCheckStatus = preflightStatus === "ok" ? "ok" : preflightStatus === "error" ? "error" : "idle";
      }
    } else {
      merged.push({
        slug: product.slug,
        name: product.name,
        quantity: 1,
        category: product.category,
        unitPrice: currentPrice,
        printCheckRequested,
        printCheckFee: printCheckRequested ? PRINT_CHECK_FEE : 0,
        printCheckFileName: uploadedFile?.name,
        printCheckFileUrl: uploadedUrl,
        printCheckStatus: preflightStatus === "ok" ? "ok" : preflightStatus === "error" ? "error" : "idle"
      });
    }
    localStorage.setItem("dud_cart", JSON.stringify(merged));
    window.dispatchEvent(new Event("dud-cart-updated"));
    setCartMessage("Produkt wurde in den Warenkorb gelegt.");
    return true;
  }

  return (
    <aside className="sticky top-24 rounded-lg border bg-white p-5 shadow-premium lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Live-Konfigurator</p>
          <h2 className="text-2xl font-black">{authenticated ? formatEuro(currentPrice) : "Preis nach Anmeldung"}</h2>
          <p className="text-sm text-muted-foreground">Konfiguration inkl. Datencheck</p>
          {authenticated ? <p className="text-xs font-semibold text-muted-foreground">Ab {formatEuro(product.basePrice)}</p> : null}
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-right text-xs font-semibold">
          <CalendarCheck className="ml-auto h-4 w-4 text-primary" />
          {config.lieferzeit === "sameday" ? "Heute versandbereit" : "Lieferung in 2-5 Tagen"}
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {[...productOptions, { label: "Auflage", key: "auflage", options: quantityOptions }].map(({ label, key, options }) => (
          <label className="grid gap-2" key={label}>
            <span className="text-sm font-bold">{label}</span>
            <select
              suppressHydrationWarning
              value={config[key]}
              onChange={(event) => setConfig({ ...config, [key]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
            </select>
          </label>
        ))}
        {enabledProperties.map((property) => (
          <label className="grid gap-2" key={`category-property-${property.name}`}>
            <span className="text-sm font-bold">{property.name}</span>
            <select
              suppressHydrationWarning
              value={config[`eigenschaft:${property.name}`] ?? normalizePropertyValue(property.values[0]).value}
              onChange={(event) => setConfig({ ...config, [`eigenschaft:${property.name}`]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {property.values.map((entry) => {
                const option = normalizePropertyValue(entry);
                return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
                );
              })}
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
          accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tif,.tiff,.heic,.heif,application/pdf,image/png,image/jpeg,image/tiff,image/heic,image/heif,image/x-adobe-photoshop,application/postscript"
          onChange={(event) => validateAndSetFile(event.target.files?.[0])}
        />
        <UploadCloud className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-2 text-sm font-bold">{uploadedFile ? uploadedFile.name : "Druckdaten hochladen"}</p>
        <p className="text-xs text-muted-foreground mt-1">Klicken oder Datei hier ablegen. PDF, AI, PSD, PNG, JPG oder TIFF bis 50 MB.</p>
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
      {(uploadError) && (
        <div className="mt-4 flex flex-col gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {uploadError}
          </div>
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
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <FileCheck className="h-4 w-4 text-emerald-600" /> Preflight
            </div>
            <Badge variant="success">BESTANDEN</Badge>
          </div>
          <p className="mt-1 leading-relaxed text-xs">{preflightMessage}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70">
            <Sparkles className="h-3 w-3 animate-pulse" /> KI-Visionsanalyse & Profi-Datencheck
          </div>
        </div>
      )}
      {preflightStatus === "error" && (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-red-200 bg-red-50/50 p-4 text-sm text-red-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <XCircle className="h-4 w-4 text-red-600" /> Preflight
            </div>
            <Badge variant="destructive">FEHLER</Badge>
          </div>
          <p className="mt-1 leading-relaxed text-xs">{preflightMessage}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-red-600/70">
            <Sparkles className="h-3 w-3" /> KI-Risikobewertung
          </div>
        </div>
      )}
      {preflightStatus === "idle" && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm text-slate-700 border">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Preflight
          </div>
          <Badge variant="outline">BEREIT</Badge>
        </div>
      )}
      {preflightStatus === "running" && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 animate-pulse">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Preflight läuft...
          </div>
          <Badge variant="secondary">PRÜFT</Badge>
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
              <div key={item.code} className={`flex items-center gap-2 ${item.passed ? "text-fuchsia-700" : "text-red-700"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="flex-1">{item.label}</span>
                <span>{item.passed ? "OK" : "Error"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-md border p-3">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={printCheckRequested}
            onChange={(event) => setPrintCheckRequested(event.target.checked)}
          />
          Profi Print-Check (KI + manuell){authenticated ? ` + ${formatEuro(PRINT_CHECK_FEE)}` : ""}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">Wird als Zusatzleistung berechnet (Abholung oder Versand).</p>
      </div>
      {authenticated ? <Button className="mt-6 w-full bg-brand-blue hover:bg-[#2c70b8]" size="lg" type="button" onClick={addToCart}>
        In den Warenkorb
      </Button> : <Button asChild className="mt-6 w-full" size="lg"><a href="/login">Anmelden und Preise sehen</a></Button>}
      {authenticated ? <Button
        className="mt-3 w-full"
        size="lg"
        variant="outline"
        type="button"
        onClick={() => {
          void (async () => {
            const ok = await addToCart();
            if (ok) router.push("/warenkorb");
          })();
        }}
      >
        Jetzt kaufen
      </Button> : null}
      {cartMessage ? <p className="mt-3 text-center text-xs text-fuchsia-700">{cartMessage}</p> : null}
      <p className="mt-3 text-center text-xs text-muted-foreground">Wir beraten Sie gerne zu Materialien und Veredelungen.</p>
    </aside>
  );
}

function normalizePropertyValue(value: ProductCategoryProperty["values"][number]) {
  if (typeof value === "string") return { value, label: value };
  return { value: value.value, label: value.label || value.value };
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
