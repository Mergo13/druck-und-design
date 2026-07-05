import { logger } from "@/lib/logger";
import https from "node:https";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 4_000;
let devInsecureAgent: https.Agent | null = null;

export type CRMInvoiceItem = {
  description: string;
  qty: number;
  price: number;
};

export type CRMInvoiceOrder = {
  customer: string;
  email: string;
  total: number;
  items: CRMInvoiceItem[];
  company?: string;
  vatId?: string;
  address?: string;
  shipping_address?: string;
  shipping_cost?: number;
  shipping_name?: string;
  processing_fee?: number;
  footer_text?: string;
};

type CRMInvoiceOrderRequest = CRMInvoiceOrder & {
  send_email?: boolean;
  send_customer_email?: boolean;
  send_admin_email?: boolean;
  send_smtp_notifications?: boolean;
};

type CRMInvoiceSuccessResponse = {
  invoice_id: number | string;
  client_id: number | string;
  invoice_number: string | number;
  pdf_url?: string;
  invoice_pdf?: string;
  download_url?: string;
  file_url?: string;
};

export type CRMInvoiceResult = {
  invoice_id: string;
  client_id: string;
  invoice_number: string;
  pdf_url?: string;
};

type CreateCRMInvoiceOptions = {
  timeoutMs?: number;
  maxRetries?: number;
};

export class CRMError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
    readonly causeValue?: unknown,
    readonly responseBody?: unknown
  ) {
    super(message);
    this.name = "CRMError";
  }
}

function getCRMConfig() {
  const url = process.env.CRM_API_URL?.trim();
  const token = process.env.CRM_API_TOKEN?.trim();

  if (!url) {
    throw new CRMError("Missing CRM_API_URL environment variable.");
  }
  if (!token) {
    throw new CRMError("Missing CRM_API_TOKEN environment variable.");
  }

  return { url, token };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 504);
}

function computeRetryDelayMs(attempt: number) {
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt + jitter, MAX_RETRY_DELAY_MS);
}

function extractErrorBody(body: unknown) {
  if (!body) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

function tryParseJson(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function validateOrder(order: CRMInvoiceOrder) {
  if (!order.customer?.trim()) {
    logger.error({ order }, "CRM order validation failed: customer is missing");
    throw new CRMError("CRM order validation failed: customer is required.");
  }
  if (!order.email?.trim()) {
    logger.error({ order }, "CRM order validation failed: email is missing");
    throw new CRMError("CRM order validation failed: email is required.");
  }
  if (!Number.isFinite(order.total) || order.total < 0) {
    logger.error({ order }, "CRM order validation failed: total is invalid");
    throw new CRMError("CRM order validation failed: total must be a valid non-negative number.");
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    logger.error({ order }, "CRM order validation failed: items array is empty or missing");
    throw new CRMError("CRM order validation failed: at least one item is required.");
  }

  for (const item of order.items) {
    if (!item.description?.trim()) {
      logger.error({ item, order }, "CRM order validation failed: item description is missing");
      throw new CRMError("CRM order validation failed: each item requires a description.");
    }
    if (!Number.isFinite(item.qty) || item.qty <= 0) {
      logger.error({ item, order }, "CRM order validation failed: item quantity is invalid");
      throw new CRMError("CRM order validation failed: each item qty must be greater than zero.");
    }
    if (!Number.isFinite(item.price) || item.price < 0) {
      logger.error({ item, order }, "CRM order validation failed: item price is invalid");
      throw new CRMError("CRM order validation failed: each item price must be a valid non-negative number.");
    }
  }
}

function normalizeCRMResponse(payload: unknown): CRMInvoiceResult {
  if (!payload || typeof payload !== "object") {
    throw new CRMError("CRM response did not return a valid JSON object.");
  }

  const response = payload as Partial<CRMInvoiceSuccessResponse>;
  if (response.invoice_id === undefined || response.client_id === undefined || response.invoice_number === undefined) {
    throw new CRMError("CRM response missing invoice_id, client_id, or invoice_number.");
  }

  return {
    invoice_id: String(response.invoice_id),
    client_id: String(response.client_id),
    invoice_number: String(response.invoice_number),
    pdf_url: response.pdf_url || response.invoice_pdf || response.download_url || response.file_url
  };
}

async function postInvoice(
  url: string,
  token: string,
  order: CRMInvoiceOrderRequest,
  timeoutMs: number
) {
  // Special check: ensure we have a valid token and it's not the string "undefined" or empty
  if (!token || token === "undefined") {
    logger.error({ crmApiUrl: url }, "Aborting CRM request: CRM_API_TOKEN is invalid or missing");
    throw new CRMError("Invalid CRM_API_TOKEN.");
  }

  logger.info(
    {
      crmApiUrl: url,
      crmApiTokenExists: Boolean(token),
      payload: order
    },
    "Posting invoice payload to CRM"
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody = JSON.stringify(order);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Accept": "application/json"
      },
      body: requestBody,
      signal: controller.signal
    });

    const text = await response.text();
    const parsed = tryParseJson(text);
    logger.info(
      {
        crmApiUrl: url,
        status: response.status,
        ok: response.ok,
        responseBody: parsed
      },
      "Received CRM response"
    );

    if (!response.ok) {
      const retryable = isTemporaryStatus(response.status);
      throw new CRMError(
        `CRM request failed with status ${response.status}. ${extractErrorBody(parsed || text)}`,
        response.status,
        retryable,
        undefined,
        parsed
      );
    }

    return normalizeCRMResponse(parsed);
  } catch (error) {
    if (error instanceof CRMError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CRMError(`CRM request timed out after ${timeoutMs}ms.`, undefined, true, error);
    }

    throw new CRMError("CRM request failed due to a network or parsing error.", undefined, true, error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function createCRMInvoice(
  order: CRMInvoiceOrder,
  options: CreateCRMInvoiceOptions = {}
): Promise<CRMInvoiceResult> {
  validateOrder(order);
  const { url, token } = getCRMConfig();
  const isDevelopment = process.env.NODE_ENV === "development";
  const requestPayload: CRMInvoiceOrderRequest = isDevelopment
    ? {
        ...order,
        send_email: false,
        send_customer_email: false,
        send_admin_email: false,
        send_smtp_notifications: false
      }
    : order;

  if (isDevelopment) {
    logger.info("Email sending disabled (development mode)");
  }
  logger.info(
    {
      crmApiUrl: url,
      crmApiTokenExists: Boolean(token)
    },
    "CRM configuration resolved"
  );

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastError: CRMError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await postInvoice(url, token, requestPayload, timeoutMs);
    } catch (error) {
      const crmError = error instanceof CRMError ? error : new CRMError("Unknown CRM error.", undefined, false, error);
      const isLastAttempt = attempt === maxRetries;

      if (!crmError.retryable || isLastAttempt) {
        logger.error({ err: crmError, attempt, maxRetries }, "Failed to create CRM invoice");
        throw crmError;
      }

      lastError = crmError;
      const delayMs = computeRetryDelayMs(attempt);
      logger.warn(
        { err: crmError, attempt, maxRetries, delayMs },
        "Temporary CRM error, retrying invoice creation"
      );
      await sleep(delayMs);
    }
  }

  throw lastError ?? new CRMError("Failed to create CRM invoice.");
}
