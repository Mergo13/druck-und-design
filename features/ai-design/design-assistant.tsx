"use client";

import { ArrowDownToLine, ArrowUpToLine, CheckCircle2, Copy, Download, FileCheck, ImagePlus, Layers3, Minus, Plus, Ruler, Sparkles, Trash2, Type, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text, Transformer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TextLayer = { id: string; kind: "text"; text: string; x: number; y: number; width: number; rotation: number; fontSize: number; fill: string };
type ImageLayer = { id: string; kind: "image"; src: string; x: number; y: number; width: number; height: number; rotation: number };
type EditorLayer = TextLayer | ImageLayer;

const canvasSize = { width: 900, height: 1200 };

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const readyAssets = [
  {
    label: "Verlaufsfläche",
    src: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="520" height="320"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect x="0" y="0" width="520" height="320" rx="18" fill="url(#g)"/><circle cx="420" cy="80" r="74" fill="rgba(255,255,255,.18)"/><circle cx="110" cy="230" r="92" fill="rgba(255,255,255,.12)"/></svg>'),
    width: 360,
    height: 220
  },
  {
    label: "Badge",
    src: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120"><rect x="0" y="0" width="300" height="120" rx="20" fill="#0f172a"/><text x="150" y="72" fill="#e2e8f0" font-size="30" text-anchor="middle" font-family="Arial">PREMIUM</text></svg>'),
    width: 220,
    height: 90
  },
  {
    label: "Technik-Raster",
    src: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520"><rect x="0" y="0" width="520" height="520" fill="#f8fafc"/><g stroke="#cbd5e1" stroke-width="1">'+Array.from({ length: 13 }).map((_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="520"/><line x1="0" y1="${i * 40}" x2="520" y2="${i * 40}"/>`).join("")+'</g></svg>'),
    width: 300,
    height: 300
  }
];

const readyTemplates = [
  {
    name: "Launch-Layout",
    layers: [
      { id: "tpl-bg", kind: "image", src: readyAssets[0].src, x: 80, y: 90, width: 740, height: 380, rotation: 0 },
      { id: "tpl-title", kind: "text", text: "Print-Workflow der nächsten Generation", x: 110, y: 140, width: 620, rotation: 0, fontSize: 64, fill: "#ffffff" },
      { id: "tpl-sub", kind: "text", text: "Automatischer Preflight, Vorlagen und Produktionssteuerung.", x: 110, y: 240, width: 620, rotation: 0, fontSize: 24, fill: "#dbeafe" }
    ] as EditorLayer[]
  },
  {
    name: "Minimal-Poster",
    layers: [
      { id: "tpl-grid", kind: "image", src: readyAssets[2].src, x: 70, y: 120, width: 760, height: 760, rotation: 0 },
      { id: "tpl-title-2", kind: "text", text: "Minimales Zukunftsdesign", x: 90, y: 920, width: 700, rotation: 0, fontSize: 58, fill: "#0f172a" }
    ] as EditorLayer[]
  }
];

export function DesignAssistant() {
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: "txt-headline", kind: "text", text: "Ihre Marke. Präzise gedruckt.", x: 80, y: 120, width: 700, rotation: 0, fontSize: 58, fill: "#0f172a" },
    { id: "txt-sub", kind: "text", text: "Web-to-Print Plattform mit Datenprüfung und Produktionsablauf.", x: 80, y: 220, width: 720, rotation: 0, fontSize: 28, fill: "#1f2937" }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [preflightMessage, setPreflightMessage] = useState("Keine Datei geprüft.");
  const [preflightDetails, setPreflightDetails] = useState<Array<{ code: string; label: string; passed: boolean; hint?: string }>>([]);
  const [zoom, setZoom] = useState(0.7);
  const [printFormat, setPrintFormat] = useState("DIN A5");
  const [bleedMm, setBleedMm] = useState(3);
  const [dpiTarget, setDpiTarget] = useState(300);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLayer = useMemo(() => layers.find((item) => item.id === selectedId), [layers, selectedId]);

  useEffect(() => {
    if (!selectedId || !trRef.current || !stageRef.current) return;
    const node = stageRef.current.findOne(`#${selectedId}`);
    if (!node) return;
    trRef.current.nodes([node]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, layers]);

  function updateLayer(id: string, updater: (layer: EditorLayer) => EditorLayer) {
    setLayers((current) => current.map((item) => item.id === id ? updater(item) : item));
  }

  function addTextLayer() {
    const id = `txt-${Date.now()}`;
    setLayers((current) => [...current, { id, kind: "text", text: "Neuer Text", x: 120, y: 320, width: 480, rotation: 0, fontSize: 36, fill: "#111827" }]);
    setSelectedId(id);
  }

  function addReadyAsset(src: string, width: number, height: number) {
    const id = `asset-${Date.now()}`;
    setLayers((current) => [...current, { id, kind: "image", src, x: 120, y: 420, width, height, rotation: 0 }]);
    setSelectedId(id);
  }

  function applyTemplate(index: number) {
    const template = readyTemplates[index];
    const nextLayers = template.layers.map((layer) => ({ ...layer, id: `${layer.id}-${Date.now()}-${Math.round(Math.random() * 1000)}` }));
    setLayers(nextLayers);
    setSelectedId(nextLayers[0]?.id ?? null);
  }

  function addImageFromFile(file?: File) {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith("image/") || ["png", "jpg", "jpeg", "tif", "tiff", "webp"].some(ext => fileName.endsWith(ext));
    if (!isImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const id = `img-${Date.now()}`;
      setLayers((current) => [...current, { id, kind: "image", src: String(reader.result), x: 120, y: 450, width: 320, height: 220, rotation: 0 }]);
      setSelectedId(id);
    };
    reader.readAsDataURL(file);
  }

  async function runPreflight() {
    setPreflightStatus("running");
    setPreflightMessage("Preflight läuft...");
    const imageLayer = layers.find((item) => item.kind === "image") as ImageLayer | undefined;
    const filename = imageLayer ? "editor-export.pdf" : "editor-export.png";
    const response = await fetch("/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        targetFormat: printFormat,
        widthPx: canvasSize.width,
        heightPx: canvasSize.height,
        colorModelHint: "RGB"
      })
    });
    const result = await response.json() as {
      valid: boolean;
      checks: Array<{ code: string; label: string; passed: boolean; hint?: string }>;
      aiAdvice?: string;
    };
    setPreflightDetails(result.checks);
    if (result.valid) {
      setPreflightStatus("ok");
      setPreflightMessage(result.aiAdvice || "Druckdaten sind produktionsbereit.");
    } else {
      setPreflightStatus("error");
      setPreflightMessage(result.aiAdvice || "Es wurden Probleme gefunden.");
    }
  }

  function exportPng() {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!uri) return;
    const link = document.createElement("a");
    link.href = uri;
    link.download = "drucklayout-entwurf.png";
    link.click();
  }

  function deleteSelectedLayer() {
    if (!selectedId) return;
    setLayers((current) => current.filter((layer) => layer.id !== selectedId));
    setSelectedId(null);
  }

  function duplicateSelectedLayer() {
    if (!selectedLayer) return;
    const id = `${selectedLayer.kind}-${Date.now()}`;
    if (selectedLayer.kind === "text") {
      const next: TextLayer = { ...selectedLayer, id, x: selectedLayer.x + 24, y: selectedLayer.y + 24 };
      setLayers((current) => [...current, next]);
    } else {
      const next: ImageLayer = { ...selectedLayer, id, x: selectedLayer.x + 24, y: selectedLayer.y + 24 };
      setLayers((current) => [...current, next]);
    }
    setSelectedId(id);
  }

  function moveSelected(direction: "front" | "back") {
    if (!selectedId) return;
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === selectedId);
      if (index === -1) return current;
      const target = direction === "front" ? Math.min(current.length - 1, index + 1) : Math.max(0, index - 1);
      if (target === index) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eef4f8,#ffffff)]">
      <div className="container-page py-10">
        <div className="mb-8">
          <p className="font-bold text-brand-blue">Design-Editor</p>
          <h1 className="mt-2 text-4xl font-black">Web-to-Print Editor</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[300px_1fr_320px]">
          <aside className="h-fit rounded-lg border bg-white p-5 shadow-soft">
            <h2 className="text-lg font-black">Werkzeuge</h2>
            <div className="mt-4 grid gap-2">
              <Button variant="outline" onClick={addTextLayer}><Type className="h-4 w-4" /> Text hinzufügen</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" /> Bild hochladen</Button>
              <Button onClick={runPreflight}>Druckdaten prüfen</Button>
              <Button variant="secondary" onClick={exportPng}><Download className="h-4 w-4" /> PNG exportieren</Button>
            </div>
            <input
              suppressHydrationWarning
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".png,.jpg,.jpeg,.tif,.tiff,.webp,image/png,image/jpeg,image/tiff,image/webp"
              onChange={(event) => addImageFromFile(event.target.files?.[0])}
            />

            <div className="mt-6 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-bold">Fertige Elemente</p>
              <div className="mt-3 grid gap-2">
                {readyAssets.map((asset) => (
                  <Button key={asset.label} variant="outline" onClick={() => addReadyAsset(asset.src, asset.width, asset.height)}>
                    <ImagePlus className="h-4 w-4" /> {asset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-bold">Vorlagen</p>
              <div className="mt-3 grid gap-2">
                {readyTemplates.map((template, index) => (
                  <Button key={template.name} variant="outline" onClick={() => applyTemplate(index)}>{template.name}</Button>
                ))}
              </div>
            </div>

            <div className={preflightStatus === "ok" ? "mt-6 rounded-lg bg-teal-50 p-4 text-sm text-teal-900 border border-teal-200" : preflightStatus === "error" ? "mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200" : "mt-6 rounded-lg bg-muted p-4 text-sm"}>
              <p className="flex items-center gap-2 font-bold">
                {preflightStatus === "ok" ? <CheckCircle2 className="h-4 w-4" /> : preflightStatus === "error" ? <XCircle className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
                Preflight
              </p>
              <p className="mt-2 leading-relaxed">{preflightMessage}</p>
              {preflightDetails.length > 0 && (
                <div className="mt-3 grid gap-1.5 border-t border-black/5 pt-3">
                  {preflightDetails.map((check) => (
                    <div key={check.code} className="flex items-start gap-2 text-[11px]">
                      <span className={check.passed ? "text-emerald-600" : "text-red-600"}>{check.passed ? "✓" : "✗"}</span>
                      <span className="flex-1">{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Layers3 className="h-4 w-4" /> Ebenen</div>
              <div className="grid gap-2">
                {layers.map((layer) => (
                  <button key={layer.id} onClick={() => setSelectedId(layer.id)} className={selectedId === layer.id ? "rounded-md border border-brand-blue bg-brand-mist px-3 py-2 text-left text-sm font-bold" : "rounded-md border px-3 py-2 text-left text-sm"}>
                    {layer.kind === "text" ? `Text: ${layer.text.slice(0, 18)}` : "Bild-Ebene"}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => moveSelected("front")}><ArrowUpToLine className="h-4 w-4" /> Vor</Button>
                <Button size="sm" variant="outline" onClick={() => moveSelected("back")}><ArrowDownToLine className="h-4 w-4" /> Zurück</Button>
                <Button size="sm" variant="outline" onClick={duplicateSelectedLayer}><Copy className="h-4 w-4" /> Duplizieren</Button>
                <Button size="sm" variant="outline" onClick={deleteSelectedLayer}><Trash2 className="h-4 w-4" /> Löschen</Button>
              </div>
            </div>

          </aside>

          <div className="rounded-lg border bg-white p-4 shadow-premium">
            <div className="mb-3 flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setZoom((current) => Math.max(0.3, Number((current - 0.1).toFixed(2))))}><Minus className="h-4 w-4" /></Button>
                <span className="w-14 text-center text-sm font-semibold">{Math.round(zoom * 100)}%</span>
                <Button size="sm" variant="outline" onClick={() => setZoom((current) => Math.min(1.6, Number((current + 0.1).toFixed(2))))}><Plus className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-slate-500">Arbeitsfläche: {canvasSize.width} x {canvasSize.height} px</p>
            </div>
            <div className="overflow-auto rounded-lg border bg-slate-100 p-4">
              <Stage
                ref={stageRef}
                scaleX={zoom}
                scaleY={zoom}
                width={canvasSize.width}
                height={canvasSize.height}
                className="mx-auto border bg-white"
                onMouseDown={(event) => { if (event.target === event.target.getStage()) setSelectedId(null); }}
              >
                <Layer>
                  <Rect x={0} y={0} width={canvasSize.width} height={canvasSize.height} fill="#f8fafc" />
                  {layers.map((layer) => layer.kind === "text" ? (
                    <Text
                      id={layer.id}
                      key={layer.id}
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      text={layer.text}
                      fill={layer.fill}
                      fontSize={layer.fontSize}
                      fontStyle="bold"
                      rotation={layer.rotation}
                      draggable
                      onClick={() => setSelectedId(layer.id)}
                      onTap={() => setSelectedId(layer.id)}
                      onDragEnd={(event) => updateLayer(layer.id, (current) => ({ ...current, x: event.target.x(), y: event.target.y() }))}
                      onTransformEnd={(event) => {
                        const node = event.target;
                        updateLayer(layer.id, (current) => ({ ...current, rotation: node.rotation(), width: Math.max(80, node.width() * node.scaleX()) }));
                        node.scaleX(1);
                        node.scaleY(1);
                      }}
                    />
                  ) : (
                    <CanvasImage
                      key={layer.id}
                      layer={layer}
                      isSelected={selectedId === layer.id}
                      onSelect={() => setSelectedId(layer.id)}
                      onChange={(next) => updateLayer(layer.id, () => next)}
                    />
                  ))}
                </Layer>
                <Layer>
                  <Transformer ref={trRef} rotateEnabled enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} />
                </Layer>
              </Stage>
            </div>
          </div>

          <aside className="h-fit rounded-lg border bg-white p-5 shadow-soft">
            <h2 className="text-lg font-black">Dokument</h2>
            <div className="mt-4 grid gap-2">
              <label className="text-sm font-bold">Format</label>
              <select suppressHydrationWarning value={printFormat} onChange={(event) => setPrintFormat(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
                <option>DIN A6</option>
                <option>DIN A5</option>
                <option>DIN A4</option>
                <option>DIN lang</option>
                <option>Quadratisch</option>
              </select>
              <label className="mt-2 text-sm font-bold">Beschnitt (mm)</label>
              <Input type="number" value={bleedMm} onChange={(event) => setBleedMm(Math.max(0, Number(event.target.value) || 0))} />
              <label className="mt-2 text-sm font-bold">Zielauflösung (dpi)</label>
              <Input type="number" value={dpiTarget} onChange={(event) => setDpiTarget(Math.max(72, Number(event.target.value) || 72))} />
            </div>

            {selectedLayer && selectedLayer.kind === "text" && (
              <div className="mt-6 rounded-lg border bg-slate-50 p-4">
                <p className="text-sm font-bold">Text-Eigenschaften</p>
                <div className="mt-3 grid gap-2">
                  <label className="text-sm font-bold">Text</label>
                  <Input value={selectedLayer.text} onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer as TextLayer, text: event.target.value }))} />
                  <label className="mt-1 text-sm font-bold">Schriftgröße</label>
                  <Input type="number" value={selectedLayer.fontSize} onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer as TextLayer, fontSize: Math.max(10, Number(event.target.value) || 10) }))} />
                  <label className="mt-1 text-sm font-bold">Farbe</label>
                  <input suppressHydrationWarning type="color" value={selectedLayer.fill} onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer as TextLayer, fill: event.target.value }))} className="h-10 w-full rounded-md border bg-white p-1" />
                </div>
              </div>
            )}

            <div className="mt-6 rounded-lg border bg-slate-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-bold"><Ruler className="h-4 w-4" /> Produktionsparameter</p>
              <div className="mt-2 grid gap-1 text-xs text-slate-600">
                <p>Format: {printFormat}</p>
                <p>Beschnitt: {bleedMm} mm</p>
                <p>Zielauflösung: {dpiTarget} dpi</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CanvasImage({ layer, isSelected, onSelect, onChange }: { layer: ImageLayer; isSelected: boolean; onSelect: () => void; onChange: (next: ImageLayer) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const ref = useRef<Konva.Image>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = layer.src;
    img.onload = () => setImage(img);
  }, [layer.src]);

  return (
    <KonvaImage
      id={layer.id}
      ref={ref}
      image={image ?? undefined}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      draggable
      stroke={isSelected ? "#235c99" : undefined}
      strokeWidth={isSelected ? 2 : 0}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => onChange({ ...layer, x: event.target.x(), y: event.target.y() })}
      onTransformEnd={() => {
        const node = ref.current;
        if (!node) return;
        onChange({ ...layer, x: node.x(), y: node.y(), width: Math.max(80, node.width() * node.scaleX()), height: Math.max(80, node.height() * node.scaleY()), rotation: node.rotation() });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
