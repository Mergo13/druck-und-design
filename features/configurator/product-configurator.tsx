"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, FileCheck, FileImage, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateVariantPrice } from "@/lib/print-workflow";
import { formatEuro } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

const options = {
  Format: ["DIN A6", "DIN A5", "DIN lang", "Quadratisch"],
  Material: ["Bilderdruck matt", "Bilderdruck glänzend", "Recyclingpapier", "Naturpapier"],
  Grammatur: ["135 g/m²", "170 g/m²", "250 g/m²", "350 g/m²"],
  Farbigkeit: ["4/0 einseitig", "4/4 beidseitig"],
  Veredelung: ["Keine", "Softtouch", "Dispersionslack", "Heißfolie Gold"],
  Auflage: ["100", "250", "500", "1.000", "2.500"],
  Lieferzeit: ["Standard", "Express", "Same Day"]
};

const acceptedExtensions = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
const maxFileSize = 50 * 1024 * 1024;

export function ProductConfigurator({ product }: { product: Product | ProductCatalogItem }) {
  const isCatalogProduct = "variants" in product;
  const firstVariant = isCatalogProduct ? product.variants[0] : null;
  const [config, setConfig] = useState<Record<string, string>>({
    Format: "DIN A5",
    Material: "Bilderdruck matt",
    Grammatur: "170 g/m²",
    Farbigkeit: "4/4 beidseitig",
    Veredelung: "Keine",
    Auflage: "500",
    Lieferzeit: "Standard"
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [preflightMessage, setPreflightMessage] = useState("Live-Vorschau und Datencheck starten nach dem Upload.");
  const [isDragging, setIsDragging] = useState(false);
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
      setUploadError("Bitte laden Sie eine PDF-, AI-, PSD-, PNG-, JPG- oder TIFF-Datei hoch.");
      return;
    }

    if (file.size > maxFileSize) {
      setUploadedFile(null);
      setUploadError("Die Datei ist zu groß. Für die Demo sind maximal 50 MB erlaubt.");
      return;
    }

    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      setMockupUrl(URL.createObjectURL(file));
    } else {
      setMockupUrl("");
    }

    setPreflightStatus("running");
    setPreflightMessage("Preflight läuft...");
    const response = await fetch("/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name })
    });
    const result = await response.json() as { valid: boolean; checks: Array<{ label: string; passed: boolean }> };
    if (result.valid) {
      setPreflightStatus("ok");
      setPreflightMessage(`Preflight bestanden: ${result.checks.filter((item) => item.passed).length}/${result.checks.length} Checks OK.`);
    } else {
      setPreflightStatus("error");
      setPreflightMessage("Preflight fehlgeschlagen. Bitte Datei prüfen.");
    }
  }

  const price = useMemo(() => {
    if (isCatalogProduct && firstVariant) {
      const quantity = Number(config.Auflage.replace(".", "")) || firstVariant.quantityRule.min;
      return calculateVariantPrice(product, firstVariant.id, quantity, {});
    }
    const quantityFactor = Number(config.Auflage.replace(".", "")) / 500;
    const finish = config.Veredelung === "Keine" ? 0 : config.Veredelung.includes("Heißfolie") ? 39 : 18;
    const speed = config.Lieferzeit === "Same Day" ? 45 : config.Lieferzeit === "Express" ? 19 : 0;
    const legacyProduct = product as Product;
    return Math.round((legacyProduct.priceFrom * quantityFactor + finish + speed) * 100) / 100;
  }, [config, firstVariant, isCatalogProduct, product]);

  return (
    <aside className="sticky top-24 rounded-lg border bg-white p-5 shadow-premium">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Live-Konfigurator</p>
          <h2 className="text-2xl font-black">{formatEuro(price)}</h2>
          <p className="text-sm text-muted-foreground">inkl. Datencheck, zzgl. Versand</p>
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-right text-xs font-semibold">
          <CalendarCheck className="ml-auto h-4 w-4 text-primary" />
          {config.Lieferzeit === "Same Day" ? "Heute versandbereit" : "Lieferung in 2-5 Tagen"}
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {Object.entries(options).map(([label, values]) => (
          <label className="grid gap-2" key={label}>
            <span className="text-sm font-bold">{label}</span>
            <select
              value={config[label]}
              onChange={(event) => setConfig({ ...config, [label]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {values.map((value) => <option key={value}>{value}</option>)}
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
          type="file"
          className="sr-only"
          accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff"
          onChange={(event) => validateAndSetFile(event.target.files?.[0])}
        />
        <UploadCloud className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-2 text-sm font-bold">{uploadedFile ? uploadedFile.name : "Druckdaten hochladen"}</p>
        <p className="text-xs text-muted-foreground">Klicken oder Datei hier ablegen. PDF, AI, PSD, PNG, JPG oder TIFF bis 50 MB.</p>
      </label>
      {uploadError && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <XCircle className="h-4 w-4" /> {uploadError}
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
      <div className={preflightStatus === "ok" ? "mt-4 flex items-center gap-2 rounded-md bg-teal-50 p-3 text-sm text-teal-900" : preflightStatus === "error" ? "mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800" : "mt-4 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700"}>
        {preflightStatus === "ok" ? <CheckCircle2 className="h-4 w-4" /> : preflightStatus === "error" ? <XCircle className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
        {preflightMessage}
      </div>
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
