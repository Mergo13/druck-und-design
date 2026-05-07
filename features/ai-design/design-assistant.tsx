"use client";

import { Download, ImagePlus, Layers3, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text, Transformer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TextLayer = { id: string; kind: "text"; text: string; x: number; y: number; width: number; rotation: number; fontSize: number; fill: string };
type ImageLayer = { id: string; kind: "image"; src: string; x: number; y: number; width: number; height: number; rotation: number };
type EditorLayer = TextLayer | ImageLayer;

const canvasSize = { width: 900, height: 1200 };

export function DesignAssistant() {
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: "txt-headline", kind: "text", text: "Ihre Marke. Präzise gedruckt.", x: 80, y: 120, width: 700, rotation: 0, fontSize: 58, fill: "#0f172a" },
    { id: "txt-sub", kind: "text", text: "Web-to-Print Plattform mit Datencheck und Produktionsworkflow.", x: 80, y: 220, width: 720, rotation: 0, fontSize: 28, fill: "#1f2937" }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preflight, setPreflight] = useState("Keine Datei geprüft.");
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

  function addImageFromFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = `img-${Date.now()}`;
      setLayers((current) => [...current, { id, kind: "image", src: String(reader.result), x: 120, y: 450, width: 320, height: 220, rotation: 0 }]);
      setSelectedId(id);
    };
    reader.readAsDataURL(file);
  }

  async function runPreflight() {
    const imageLayer = layers.find((item) => item.kind === "image") as ImageLayer | undefined;
    const filename = imageLayer ? "editor-export.pdf" : "editor-export.png";
    const response = await fetch("/api/preflight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename }) });
    const result = await response.json() as { valid: boolean; checks: Array<{ label: string; passed: boolean }> };
    setPreflight(result.checks.map((item) => `${item.passed ? "OK" : "FEHLER"}: ${item.label}`).join(" | "));
  }

  function exportPng() {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!uri) return;
    const link = document.createElement("a");
    link.href = uri;
    link.download = "drucklayout-entwurf.png";
    link.click();
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eef4f8,#ffffff)]">
      <div className="container-page py-10">
        <div className="mb-8">
          <p className="font-bold text-brand-blue">Personalisierungs-Editor Foundation</p>
          <h1 className="mt-2 text-4xl font-black">Konva-basierter Web-to-Print Editor</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-lg border bg-white p-5 shadow-soft">
            <h2 className="text-lg font-black">Werkzeuge</h2>
            <div className="mt-4 grid gap-2">
              <Button variant="outline" onClick={addTextLayer}><Type className="h-4 w-4" /> Text hinzufügen</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" /> Bild hochladen</Button>
              <Button onClick={runPreflight}>Druckdaten prüfen</Button>
              <Button variant="secondary" onClick={exportPng}><Download className="h-4 w-4" /> PNG exportieren</Button>
            </div>
            <input ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={(event) => addImageFromFile(event.target.files?.[0])} />

            <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
              <p className="font-bold">Preflight</p>
              <p className="mt-2 text-muted-foreground">{preflight}</p>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Layers3 className="h-4 w-4" /> Ebenen</div>
              <div className="grid gap-2">
                {layers.map((layer) => (
                  <button key={layer.id} onClick={() => setSelectedId(layer.id)} className={selectedId === layer.id ? "rounded-md border border-brand-blue bg-brand-mist px-3 py-2 text-left text-sm font-bold" : "rounded-md border px-3 py-2 text-left text-sm"}>
                    {layer.kind === "text" ? `Text: ${layer.text.slice(0, 18)}` : "Bild"}
                  </button>
                ))}
              </div>
            </div>

            {selectedLayer && selectedLayer.kind === "text" && (
              <div className="mt-6 grid gap-2">
                <label className="text-sm font-bold">Text</label>
                <Input value={selectedLayer.text} onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer as TextLayer, text: event.target.value }))} />
              </div>
            )}
          </aside>

          <div className="rounded-lg border bg-white p-4 shadow-premium">
            <div className="overflow-auto">
              <Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height} className="mx-auto border bg-white" onMouseDown={(event) => { if (event.target === event.target.getStage()) setSelectedId(null); }}>
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
