import { NextResponse } from "next/server";
import { getSendcloudRates, estimateWeight } from "@/lib/sendcloud";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, toCountry, toPostcode } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: "Ungültige Artikel." }, { status: 400 });
    }

    const weight = estimateWeight(items);
    const country = toCountry || "AT"; // Fallback to AT

    const rates = await getSendcloudRates({
      weight,
      toCountry: country,
      toPostcode
    });

    return NextResponse.json({ rates, weight, country });
  } catch (error) {
    console.error("Shipping rates error:", error);
    return NextResponse.json({ message: "Fehler beim Abrufen der Versandkosten." }, { status: 500 });
  }
}
