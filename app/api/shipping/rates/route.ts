import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";
import { getSendcloudRates, estimateWeight } from "@/lib/sendcloud";

export async function POST(request: Request) {
  try {
    await ensureAdminBootstrap();
    const body = await request.json();
    const { items, toCountry, toPostcode } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: "Ungültige Artikel." }, { status: 400 });
    }

    const weight = estimateWeight(items);
    const country = toCountry || "AT"; // Fallback to AT
    const configuredRates = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: [{ price: "asc" }, { name: "asc" }]
    });

    if (configuredRates.length > 0) {
      return NextResponse.json({
        rates: configuredRates.map((rate) => ({
          id: rate.id,
          name: rate.name,
          price: rate.price,
          currency: "EUR",
          carrier: "admin",
          etaDays: rate.etaDays
        })),
        weight,
        country,
        source: "admin"
      });
    }

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
