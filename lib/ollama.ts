import "server-only";
import { z } from "zod";
import { aiCommerceDebug } from "@/lib/ai-commerce-debug";
import type { AICommerceCommand, AICommerceScalar, AICommerceStateInput } from "@/lib/ai-commerce-types";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen2.5-coder:7b";
const OLLAMA_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = [
  "Du bist der Intent-Parser für den Onlineshop von Druck & Design Studio.",
  "Du bist niemals selbst der Shop und führst keine Aktion direkt aus.",
  "Extrahiere ausschließlich einen strukturierten Befehl aus der deutschen Kundennachricht.",
  "Die Anwendung validiert Produkte, Optionen, Preise und Warenkorbzustand.",
  "Erfinde niemals Produkte, IDs, Preise, URLs, Optionen, Verfügbarkeiten, Lieferzeiten, Versanddaten oder technische Angaben.",
  "Verwende Produktnamen oder Slugs nur aus dem bereitgestellten Katalog.",
  "Extrahiere trotzdem alle vom Kunden ausdrücklich genannten Produktmerkmale in attributes, auch wenn sie nicht im Katalog vorkommen.",
  "Übernimm dabei die Kundenwerte unverändert; übersetze sie nicht eigenmächtig in vermeintliche technische Optionswerte.",
  "Die Anwendung ordnet diese untrusted Attribute anschließend realen Optionen zu oder weist sie sichtbar zurück.",
  "Entscheidungsregeln:",
  "configure_product: Der Kunde beschreibt ein neues gewünschtes Produkt, besonders wenn der Shopzustand leer ist.",
  "add_product: Der Kunde möchte ausdrücklich ein weiteres Produkt zur bestehenden Zusammenstellung hinzufügen.",
  "update_item: Der Kunde ändert Menge oder Optionen einer bereits konfigurierten Position.",
  "remove_item: Der Kunde möchte eine vorhandene Position entfernen.",
  "add_to_cart: Nur wenn der Kunde ausdrücklich Warenkorb, bestellen oder kaufen sagt.",
  "quote_total: Nur bei einer ausdrücklichen Preis- oder Gesamtsummenfrage.",
  "Wenn der Shopzustand leer ist und der Kunde mit 'Ich brauche' ein Produkt beschreibt, verwende immer configure_product.",
  "Beispiel: 'Ich brauche 500 A5 Flyer, beidseitig und matt.' ergibt configure_product, productQuery=flyer und attributes mit quantity=500, format=A5, printSides=beidseitig, finish=matt.",
  "Für Änderungen an der aktuellen Position verwende itemRef=current oder die sichtbare draft-ID beziehungsweise den Produkt-Slug.",
  "Bei Fragen nach dem Gesamtpreis verwende quote_total. Berechne niemals selbst einen Preis.",
  "Bei Warenkorb-Anweisungen verwende add_to_cart und itemRefs=[all] oder bekannte draft-IDs.",
  "Gib ausschließlich ein JSON-Objekt im geforderten Format zurück."
].join(" ");

const scalarSchema = z.union([
  z.string().trim().max(160),
  z.number().finite(),
  z.boolean(),
  z.null()
]);

const commandSchema = z.object({
  action: z.enum([
    "configure_product",
    "update_item",
    "add_product",
    "remove_item",
    "add_to_cart",
    "quote_total",
    "request_information"
  ]),
  productQuery: z.string().trim().max(160).nullable(),
  itemRef: z.string().trim().max(80).nullable(),
  attributes: z.record(z.string().trim().min(1).max(80), scalarSchema).refine((value) => Object.keys(value).length <= 20),
  itemRefs: z.array(z.string().trim().min(1).max(80)).max(8),
  fields: z.array(z.string().trim().min(1).max(80)).max(12)
}).strict();

const ollamaResponseSchema = z.object({
  message: z.object({
    content: z.string().trim().min(1).max(10_000)
  })
});

const responseFormat = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["configure_product", "update_item", "add_product", "remove_item", "add_to_cart", "quote_total", "request_information"]
    },
    productQuery: { type: ["string", "null"] },
    itemRef: { type: ["string", "null"] },
    attributes: {
      type: "object",
      additionalProperties: { type: ["string", "number", "boolean", "null"] }
    },
    itemRefs: { type: "array", items: { type: "string" }, maxItems: 8 },
    fields: { type: "array", items: { type: "string" }, maxItems: 12 }
  },
  required: ["action", "productQuery", "itemRef", "attributes", "itemRefs", "fields"],
  additionalProperties: false
} as const;

export type OllamaCommerceCatalogProduct = {
  slug: string;
  name: string;
  tags: string[];
  attributes: string[];
};

export class OllamaTimeoutError extends Error {}

function getOllamaConfig() {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  return {
    chatUrl: new URL("api/chat", `${baseUrl.replace(/\/+$/, "")}/`),
    model
  };
}

function parseCommand(content: string): AICommerceCommand {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = commandSchema.safeParse(JSON.parse(normalized) as unknown);
  if (!parsed.success) throw new Error("Ollama returned an invalid commerce command.");
  return parsed.data;
}

function safeStateContext(state: AICommerceStateInput) {
  return {
    activeItemId: state.activeItemId,
    items: state.items.map((item) => ({
      id: item.id,
      product: item.productSlug,
      quantity: item.quantity,
      configuration: item.configuration
    }))
  };
}

export async function requestOllamaCommerceCommand(params: {
  message: string;
  catalog: OllamaCommerceCatalogProduct[];
  state: AICommerceStateInput;
}): Promise<AICommerceCommand> {
  const { chatUrl, model } = getOllamaConfig();
  const context = {
    catalog: params.catalog.slice(0, 120),
    commerceState: safeStateContext(params.state)
  };

  try {
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nSicherer Shop-Kontext:\n${JSON.stringify(context)}` },
          { role: "user", content: params.message }
        ],
        format: responseFormat,
        stream: false,
        think: false,
        options: { temperature: 0.1 }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS)
    });

    if (!response.ok) throw new Error("Ollama request failed.");
    const rawResponse = await response.json().catch(() => null);
    aiCommerceDebug("raw-ollama-response", rawResponse);
    const responseBody = ollamaResponseSchema.safeParse(rawResponse);
    if (!responseBody.success) throw new Error("Ollama returned an invalid response.");
    const command = parseCommand(responseBody.data.message.content);
    aiCommerceDebug("parsed-action", command);
    return command;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new OllamaTimeoutError("Ollama request timed out.");
    }
    throw error;
  }
}

export type { AICommerceScalar };
