"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileCheck, FileImage, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatProductDeliveryText } from "@/lib/product-delivery";
import { calculateConfiguredProductPrice, calculateSelectedCategoryPropertiesPrice, calculateTierPrice, calculateVariantPrice } from "@/lib/print-workflow";
import { formatEuro } from "@/lib/utils";
import type { ProductCatalogItem, ProductCategoryProperty } from "@/types/print-platform";

const acceptedExtensions = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".heic", ".heif", ".svg", ".eps"];
const maxFileSize = 50 * 1024 * 1024;
const fixedQuantitySteps = [1, 10, 100, 1000, 2500, 5000, 10000];

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
    const steps = product.pricingType === "tiered" && product.priceTiers?.length
      ? product.priceTiers.flatMap((tier) => [Number(tier.fromQuantity ?? tier.quantity), Number(tier.toQuantity)]).filter(Boolean)
      : product.quantitySteps?.length
        ? product.quantitySteps
        : fixedQuantitySteps;
    return Array.from(new Set(steps)).map((step) => ({
      value: String(step),
      label: step.toLocaleString("de-DE")
    }));
  }, [product.priceTiers, product.pricingType, product.quantitySteps]);

  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (firstVariant) {
      for (const attribute of firstVariant.attributes) {
        if (attribute.type !== "select") continue;
        const selected = attribute.options?.find((option) => option.value === attribute.defaultValue);
        initial[attribute.key] = selected?.value ?? attribute.options?.[0]?.value ?? "";
      }
    }
    initial.auflage = quantityOptions[0]?.value ?? String(fixedQuantitySteps[0]);
    if (product.pricingType === "area") {
      initial.areaWidthCm = String(product.areaPricing?.defaultWidthCm ?? 100);
      initial.areaHeightCm = String(product.areaPricing?.defaultHeightCm ?? 100);
    }
    for (const property of product.pricingProperties ?? []) {
      const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
      initial[`eigenschaft:${property.name}`] = enabledValues.find((value) => value.defaultSelected)?.value ?? enabledValues[0]?.value ?? "";
    }
    return initial;
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [categoryProperties, setCategoryProperties] = useState<ProductCategoryProperty[]>([]);
  const currentQuantity = Math.max(1, Math.round(Number(config.auflage ?? fixedQuantitySteps[0]) || 1));

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
    if (product.pricingProperties?.length) {
      return [];
    }
    const enabled = new Set(product.enabledCategoryProperties ?? []);
    if (!enabled.size) return [];
    return categoryProperties.filter((property) => enabled.has(property.name) && property.values.length > 0);
  }, [categoryProperties, product.enabledCategoryProperties]);
  const currentPrice = useMemo(() => {
    const quantity = Number.isFinite(currentQuantity) ? currentQuantity : 1;
    if (product.pricingType === "tiered" || product.pricingType === "area" || product.pricingProperties?.length) {
      return calculateConfiguredProductPrice(product, quantity, config).total;
    }
    const productPrice = firstVariant
      ? calculateVariantPrice(product, firstVariant.id, quantity, config)
      : product.basePrice;
    return Math.round((productPrice + calculateSelectedCategoryPropertiesPrice(enabledProperties, quantity, config)) * 100) / 100;
  }, [config, currentQuantity, enabledProperties, firstVariant, product]);
  const tierBreakdown = useMemo(() => {
    if (product.pricingType !== "tiered") return null;
    try {
      return calculateTierPrice(currentQuantity, product.priceTiers);
    } catch {
      return null;
    }
  }, [currentQuantity, product.priceTiers, product.pricingType]);
  const displayedTotal = currentPrice;

  async function readFilePreview(file: File) {
    const fileName = file.name.toLowerCase();
    let widthPx: number | undefined;
    let heightPx: number | undefined;

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
    return { fileName, widthPx, heightPx };
  }

  async function validateAndSetFile(file?: File) {
    setUploadError("");
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAllowed = acceptedExtensions.some((extension) => fileName.endsWith(extension));

    if (!isAllowed) {
      setUploadedFile(null);
      setUploadError("Bitte laden Sie eine PDF-, AI-, PSD-, EPS-, PNG-, JPG-, TIFF-, HEIC- oder WebP-Datei hoch.");
      return;
    }

    if (file.size > maxFileSize) {
      setUploadedFile(null);
      setUploadError("Die Datei ist zu groß. Maximal 50 MB erlaubt.");
      return;
    }

    setUploadedFile(file);
    await readFilePreview(file);
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
      config?: Record<string, string>;
    }>;

    let uploadedUrl: string | undefined;
    if (uploadedFile) {
      try {
        const uploaded = await uploadPrintFile(uploadedFile);
        uploadedUrl = uploaded.url;
      } catch (error) {
        setCartMessage(error instanceof Error ? error.message : "Datei-Upload fehlgeschlagen.");
        return false;
      }
    }

    const merged = [...existing];
    const priceSnapshot = calculateConfiguredProductPrice(product, currentQuantity, config);
    const baseBreakdown = product.pricingType === "tiered"
      ? (() => {
        try {
          const tier = calculateTierPrice(currentQuantity, product.priceTiers);
          return `${tier.quantity} Stück × ${formatEuro(tier.unitPrice)} / Stück = ${formatEuro(tier.totalPrice)}`;
        } catch {
          return formatEuro(priceSnapshot.basePrice);
        }
      })()
      : formatEuro(priceSnapshot.basePrice);
    const selectedConfig = Object.fromEntries([
      ["Menge", String(currentQuantity)],
      ["Grundpreis", baseBreakdown],
      ...priceSnapshot.lines.map((line) => [line.label, `${line.value}${line.price ? ` (+${formatEuro(line.price)})` : ""}`])
    ]);
    const found = merged.find((entry) => entry.slug === product.slug);
    if (found) {
      found.quantity += 1;
      found.unitPrice = currentPrice;
      found.config = selectedConfig;
      if (uploadedFile) {
        found.printCheckFileName = uploadedFile.name;
        found.printCheckFileUrl = uploadedUrl ?? found.printCheckFileUrl;
      }
    } else {
      merged.push({
        slug: product.slug,
        name: product.name,
        quantity: 1,
        category: product.category,
        unitPrice: currentPrice,
        printCheckRequested: false,
        printCheckFee: 0,
        printCheckFileName: uploadedFile?.name,
        printCheckFileUrl: uploadedUrl,
        config: selectedConfig
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
          <h2 className="text-2xl font-black">{authenticated ? formatEuro(displayedTotal) : "Preis nach Anmeldung"}</h2>
          <p className="text-sm text-muted-foreground">Konfiguration mit optionalem Datei-Upload</p>
          {authenticated && tierBreakdown ? <p className="text-xs font-semibold text-muted-foreground">{tierBreakdown.quantity} Stück × {formatEuro(tierBreakdown.unitPrice)} / Stück = {formatEuro(tierBreakdown.totalPrice)}</p> : null}
          {authenticated ? <p className="text-xs font-semibold text-muted-foreground">Ab {formatEuro(product.basePrice)}</p> : null}
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-right text-xs font-semibold">
          <CalendarCheck className="ml-auto h-4 w-4 text-primary" />
          {formatProductDeliveryText(product.deliveryText, config.lieferzeit)}
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {productOptions.map(({ label, key, options }) => (
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
        <label className="grid gap-2">
          <span className="text-sm font-bold">Auflage</span>
          {product.pricingType === "tiered" ? (
            <input
              suppressHydrationWarning
              type="number"
              min="1"
              step="1"
              value={config.auflage ?? "1"}
              onChange={(event) => setConfig({ ...config, auflage: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <select
              suppressHydrationWarning
              value={config.auflage}
              onChange={(event) => setConfig({ ...config, auflage: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {quantityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>
        {product.pricingType === "area" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Breite (cm)</span>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                step="0.1"
                value={config.areaWidthCm ?? ""}
                onChange={(event) => setConfig({ ...config, areaWidthCm: event.target.value })}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Höhe (cm)</span>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                step="0.1"
                value={config.areaHeightCm ?? ""}
                onChange={(event) => setConfig({ ...config, areaHeightCm: event.target.value })}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
        ) : null}
        {(product.pricingProperties ?? []).map((property) => {
          const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
          if (!enabledValues.length) return null;
          return (
          <label className="grid gap-2" key={`product-property-${property.name}`}>
            <span className="text-sm font-bold">{property.name}</span>
            <select
              suppressHydrationWarning
              value={config[`eigenschaft:${property.name}`] ?? enabledValues.find((value) => value.defaultSelected)?.value ?? enabledValues[0]?.value ?? ""}
              onChange={(event) => setConfig({ ...config, [`eigenschaft:${property.name}`]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {enabledValues.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.labelOverride || option.label || option.value}
                </option>
              ))}
            </select>
          </label>
          );
        })}
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
        <p className="mt-2 text-sm font-bold">{uploadedFile ? uploadedFile.name : "Druckdaten / Dokument hochladen"}</p>
        <p className="text-xs text-muted-foreground mt-1">Klicken oder Datei hier ablegen. Upload ist auch ohne Profi Print-Check möglich.</p>
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
      {uploadedFile ? (
        <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Datei wird mit der Bestellung hochgeladen
          </div>
          <Badge variant="outline">UPLOAD</Badge>
        </div>
      ) : null}
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
