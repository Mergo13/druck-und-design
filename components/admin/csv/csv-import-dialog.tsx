"use client";

import { AlertCircle, CheckCircle2, FileText, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CsvImportPreviewRow = {
  index: number;
  status: "create" | "update" | "skip" | "error";
  errors: string[];
  warnings: string[];
  product?: { slug?: string; name?: string; category?: string; basePrice?: number; productStatus?: string };
};

type CsvImportValidation = {
  delimiter: string;
  headers: string[];
  rowCount: number;
  valid: number;
  warnings: number;
  errors: number;
  preview: CsvImportPreviewRow[];
};

type CsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

type CsvImportDialogProps = {
  resource: "products" | "categories" | "properties" | "industries";
  onImported?: () => void;
};

export function CsvImportDialog({ resource, onImported }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "validate" | "confirm" | "result">("upload");
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [strategy, setStrategy] = useState<"skip" | "update" | "duplicate">("update");
  const [importMode, setImportMode] = useState<"merge" | "price-update-only" | "properties-update-only" | "full-replace">("merge");
  const [validation, setValidation] = useState<CsvImportValidation | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canImport = useMemo(() => Boolean(validation && validation.valid > 0), [validation]);

  function resetDialog() {
    setStep("upload");
    setFilename("");
    setContent("");
    setValidation(null);
    setResult(null);
    setMessage("");
    setBusy(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  async function readFile(file: File) {
    if (busy) return;
    setMessage("");
    setValidation(null);
    setResult(null);
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Die CSV-Datei ist zu groß. Maximal erlaubt sind 5 MB.");
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    setContent(text);
    setStep("validate");
    await validate(text, file.name);
  }

  async function validate(text = content, file = filename) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/csv/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", filename: file, content: text, strategy, importMode })
      });
      const json = await response.json().catch(() => null) as CsvImportValidation | { message?: string } | null;
      if (!response.ok) {
        setMessage(json && "message" in json && json.message ? json.message : "CSV-Validierung fehlgeschlagen.");
        return;
      }
      setValidation(json as CsvImportValidation);
      setStep("confirm");
    } catch {
      setMessage("CSV-Validierung konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  }

  async function importCsv() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/csv/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", filename, content, strategy, importMode })
      });
      const json = await response.json().catch(() => null) as CsvImportResult | { message?: string } | null;
      if (!response.ok) {
        setMessage(json && "message" in json && json.message ? json.message : "CSV-Import fehlgeschlagen.");
        return;
      }
      setResult(json as CsvImportResult);
      setStep("result");
      await onImported?.();
    } catch {
      setMessage("CSV-Import konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          Importieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>CSV importieren</DialogTitle>
          <DialogDescription>CSV hochladen, prüfen, voranzeigen und bestätigen, bevor Katalogdaten in die Datenbank geschrieben werden.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {["Hochladen", "Einlesen", "Spaltenzuordnung", "Validierung", "Vorschau", "Strategie", "Bestätigung", "Ergebnis"].map((label, index) => (
              <span key={label} className="rounded-full border bg-slate-50 px-2.5 py-1 text-slate-600">{index + 1}. {label}</span>
            ))}
          </div>

          {message ? (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          ) : null}

          {step === "upload" || step === "validate" ? (
            <div className="grid gap-3">
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 p-6 text-center hover:bg-slate-100">
                <Upload className="h-8 w-8 text-slate-400" />
                <span className="mt-3 text-sm font-black text-slate-950">CSV hier ablegen oder Datei auswählen</span>
                <span className="mt-1 text-sm text-slate-500">UTF-8-CSV, Semikolon oder Komma als Trennzeichen, maximal 5 MB</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void readFile(file);
                  }}
                />
              </label>
              <div className="rounded-lg border bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Raw CSV einfügen
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFilename(filename || "raw.csv");
                      void validate(content, filename || "raw.csv");
                    }}
                    disabled={busy || !content.trim()}
                  >
                    Vorschau prüfen
                  </Button>
                </div>
                <textarea
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setValidation(null);
                    setResult(null);
                  }}
                  className="min-h-44 w-full rounded-md border bg-slate-950 p-3 font-mono text-xs text-slate-50 outline-none focus:ring-2 focus:ring-ring"
                  placeholder={'slug;priceTiers\nflyer;"1-9:1.50|10-24:0.85|25-49:0.55"'}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : null}

          {validation ? (
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4">
                <Metric label="Zeilen erkannt" value={validation.rowCount} />
                <Metric label="Gültig" value={validation.valid} tone="success" />
                <Metric label="Warnungen" value={validation.warnings} tone="warning" />
                <Metric label="Fehler" value={validation.errors} tone="error" />
              </div>

              <div className="grid gap-2 rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Importstrategie</p>
                    <p className="text-sm text-slate-500">Bestehende Produkte werden über den Slug erkannt.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resource === "products" ? (
                      <Select value={importMode} onValueChange={(value) => setImportMode(value as typeof importMode)}>
                        <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge">Merge</SelectItem>
                          <SelectItem value="price-update-only">Nur Preisstaffeln</SelectItem>
                          <SelectItem value="properties-update-only">Nur Eigenschaften</SelectItem>
                          <SelectItem value="full-replace">Full Replace</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                    <Select value={strategy} onValueChange={(value) => setStrategy(value as "skip" | "update" | "duplicate")}>
                      <SelectTrigger className="sm:w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Bestehende überspringen</SelectItem>
                        <SelectItem value="update">Bestehende aktualisieren</SelectItem>
                        <SelectItem value="duplicate">Duplikate erstellen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => validate()} disabled={busy}>
                  Strategie erneut prüfen
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <div className="border-b bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Vorschau der ersten 20 Zeilen</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-white text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Zeile</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Datensatz</th>
                        <th className="px-4 py-2">Kategorie</th>
                        <th className="px-4 py-2">Hinweise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.map((row) => (
                        <tr key={row.index} className="border-t">
                          <td className="px-4 py-2">{row.index}</td>
                          <td className="px-4 py-2"><StatusBadge status={row.status} /></td>
                          <td className="px-4 py-2 font-semibold">{row.product?.name ?? row.product?.slug ?? "-"}</td>
                          <td className="px-4 py-2">{row.product?.category ?? "-"}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{[...row.errors, ...row.warnings].join(" | ") || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              Erstellt: {result.created}, aktualisiert: {result.updated}, übersprungen: {result.skipped}, fehlgeschlagen: {result.failed}.
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Schließen</Button>
          {step === "confirm" ? (
            <Button type="button" onClick={importCsv} disabled={!canImport || busy}>
              Import bestätigen
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={tone === "success" ? "text-2xl font-black text-emerald-700" : tone === "warning" ? "text-2xl font-black text-amber-700" : tone === "error" ? "text-2xl font-black text-red-700" : "text-2xl font-black text-slate-950"}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: CsvImportPreviewRow["status"] }) {
  if (status === "error") return <Badge variant="destructive">Fehler</Badge>;
  if (status === "update") return <Badge variant="warning">Aktualisieren</Badge>;
  if (status === "skip") return <Badge variant="secondary">Überspringen</Badge>;
  return <Badge variant="success">Erstellen</Badge>;
}
