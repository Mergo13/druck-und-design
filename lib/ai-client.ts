import type {
  AICommerceResponse,
  AICommerceState,
  AICommerceStateInput
} from "@/lib/ai-commerce-types";

type AiErrorResponse = {
  message?: string;
};

export const emptyCommerceState: AICommerceState = {
  activeItemId: null,
  items: [],
  total: { status: "empty" }
};

export function commerceStateForRequest(state: AICommerceState): AICommerceStateInput {
  return {
    activeItemId: state.activeItemId,
    items: state.items.map((item) => ({
      id: item.id,
      productSlug: item.product.slug,
      quantity: item.quantity,
      configuration: item.configuration,
      unresolved: item.unresolved
    }))
  };
}

function isCommerceResponse(value: unknown): value is AICommerceResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AICommerceResponse>;
  return typeof candidate.reply === "string"
    && typeof candidate.action === "string"
    && Boolean(candidate.state && Array.isArray(candidate.state.items));
}

async function postAi(body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  const data = await response.json().catch(() => null) as AICommerceResponse | AiErrorResponse | null;
  if (!response.ok) {
    throw new Error(data && "message" in data && data.message
      ? data.message
      : "Der Produktberater ist derzeit nicht erreichbar.");
  }
  if (!isCommerceResponse(data)) {
    throw new Error("Der Produktberater hat keine gültige Antwort geliefert.");
  }
  return data;
}

export function requestAiCommerce(message: string, state: AICommerceState, signal?: AbortSignal) {
  return postAi({ mode: "command", message, state: commerceStateForRequest(state) }, signal);
}

export function synchronizeAiCommerce(state: AICommerceState, signal?: AbortSignal) {
  return postAi({ mode: "sync", state: commerceStateForRequest(state) }, signal);
}

export type {
  AICommerceCartEntry,
  AICommerceItem,
  AICommerceOption,
  AICommerceResponse,
  AICommerceState
} from "@/lib/ai-commerce-types";
