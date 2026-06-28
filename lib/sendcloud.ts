import { logger } from "./logger";

const SENDCLOUD_PUBLIC_KEY = process.env.SENDCLOUD_PUBLIC_KEY;
const SENDCLOUD_SECRET_KEY = process.env.SENDCLOUD_SECRET_KEY;
const SENDCLOUD_FROM_COUNTRY = process.env.SENDCLOUD_FROM_COUNTRY || "AT";

export type SendcloudRateRequest = {
  weight: number; // in kg
  toCountry: string; // ISO 2-letter code
  toPostcode?: string;
  shippingMethodId?: number;
};

export type SendcloudRateResponse = {
  id: number;
  name: string;
  price: number;
  currency: string;
  carrier: string;
};

/**
 * Fetches shipping rates from Sendcloud.
 * If credentials are missing, it returns a default fallback rate to avoid breaking the checkout.
 */
export async function getSendcloudRates(params: SendcloudRateRequest): Promise<SendcloudRateResponse[]> {
  if (!SENDCLOUD_PUBLIC_KEY || !SENDCLOUD_SECRET_KEY) {
    logger.warn("Sendcloud credentials missing. Using fallback shipping rates.");
    return [
      {
        id: 1,
        name: "Post AT Standard",
        price: 5.90,
        currency: "EUR",
        carrier: "postat"
      },
      {
        id: 2,
        name: "DPD Classic",
        price: 6.50,
        currency: "EUR",
        carrier: "dpd"
      }
    ];
  }

  try {
    const auth = Buffer.from(`${SENDCLOUD_PUBLIC_KEY}:${SENDCLOUD_SECRET_KEY}`).toString("base64");
    const url = new URL("https://panel.sendcloud.sc/api/v2/shipping-prices");
    url.searchParams.append("weight", params.weight.toString());
    url.searchParams.append("from_country", SENDCLOUD_FROM_COUNTRY);
    url.searchParams.append("to_country", params.toCountry);
    if (params.toPostcode) {
      url.searchParams.append("to_postcode", params.toPostcode);
    }
    if (params.shippingMethodId) {
      url.searchParams.append("shipping_method_id", params.shippingMethodId.toString());
    }

    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error({ status: res.status, error: errorText }, "Sendcloud API error");
      throw new Error(`Sendcloud API error: ${res.status}`);
    }

    const data = await res.json();
    // Sendcloud returns an array of prices
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name || "Versand",
      price: item.price || 0,
      currency: item.currency || "EUR",
      carrier: item.carrier || "unknown"
    }));
  } catch (error) {
    logger.error({ error }, "Failed to fetch Sendcloud rates");
    return [
      {
        id: 1,
        name: "Post AT Standard (Fallback)",
        price: 5.90,
        currency: "EUR",
        carrier: "postat"
      },
      {
        id: 2,
        name: "DPD Classic (Fallback)",
        price: 6.50,
        currency: "EUR",
        carrier: "dpd"
      }
    ];
  }
}

/**
 * Helper to estimate total weight of cart items.
 * Uses a basic heuristic based on typical weights for categories.
 */
export function estimateWeight(items: any[]): number {
  return items.reduce((sum, item) => {
    let itemWeight = 0.5; // Default 0.5kg
    
    // Category based estimation if no weight is provided
    const cat = (item.category || "").toLowerCase();
    if (cat.includes("flyer")) itemWeight = 0.2;
    if (cat.includes("visitenkarten")) itemWeight = 0.1;
    if (cat.includes("werbetechnik") || cat.includes("rollup") || cat.includes("schilder")) itemWeight = 2.5;
    if (cat.includes("textil")) itemWeight = 0.3;
    if (cat.includes("broschueren")) itemWeight = 0.4;
    
    return sum + (item.weight || itemWeight) * (item.quantity || 1);
  }, 0);
}
