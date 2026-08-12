import { NextResponse } from "next/server";
import { getCategories, getProducts, getPublicProducts, upsertProduct } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import type { ProductCatalogItem } from "@/types/print-platform";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { validateProductPricing } from "@/lib/print-workflow";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("products", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    return NextResponse.json(await getProducts());
  }
  const products = await getPublicProducts();
  const session = await getSessionUser();
  return NextResponse.json(session ? products : products.map(withoutPrices));
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as ProductCatalogItem;
  const products = await getProducts();
  const existingProduct = products.find((item) => item.slug === body.slug);
  const existing = Boolean(existingProduct);
  const permission = await requireModulePermission("products", existing ? "update" : "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const nextPricingSnapshot = JSON.stringify({
    pricingType: body.pricingType,
    basePrice: body.basePrice,
    areaPricing: body.areaPricing,
    priceTiers: body.priceTiers,
    pricingProperties: body.pricingProperties
  });
  const previousPricingSnapshot = existingProduct ? JSON.stringify({
    pricingType: existingProduct.pricingType,
    basePrice: existingProduct.basePrice,
    areaPricing: existingProduct.areaPricing,
    priceTiers: existingProduct.priceTiers,
    pricingProperties: existingProduct.pricingProperties
  }) : "";
  const priceHistory = existingProduct && previousPricingSnapshot !== nextPricingSnapshot
    ? [
      ...(body.priceHistory ?? existingProduct.priceHistory ?? []).slice(-49),
      {
        changedAt: new Date().toISOString(),
        user: "Admin",
        summary: "Preisstruktur geändert"
      }
    ]
    : body.priceHistory ?? existingProduct?.priceHistory;
  const product: ProductCatalogItem = {
    ...body,
    priceHistory,
    productStatus: body.productStatus ?? (body.published === false || body.visible === false ? "inactive" : "active"),
    visible: body.productStatus ? body.productStatus === "active" : (body.visible ?? true),
    published: body.productStatus ? body.productStatus === "active" : (body.published ?? true)
  };
  const validationErrors = validateProductPricing(product);
  if (validationErrors.length) {
    return NextResponse.json({ message: validationErrors[0], errors: validationErrors }, { status: 400 });
  }
  const categories = await getCategories();
  const isValidCategory = categories.some((item) => item.slug === product.category);
  if (!isValidCategory) {
    return NextResponse.json({ message: "Ungültige Kategorie. Bitte bestehende Kategorie verwenden." }, { status: 400 });
  }
  return NextResponse.json(await upsertProduct(product));
}
