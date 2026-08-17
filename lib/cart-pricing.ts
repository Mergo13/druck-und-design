import { promises as fs } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { getCategories, getGlobalProperties, getPublicProductBySlug } from "@/lib/catalog-repository";
import { pricingQuantitiesForDocument } from "@/lib/document-production";
import { resolveBindingConfigurationForProduct, type BindingResolutionResult } from "@/lib/binding-resolution";
import { getProductionBindingConfig } from "@/lib/production-binding-config";
import { calculateConfiguredProductPrice, calculateSelectedCategoryPropertiesPrice, calculateVariantPrice } from "@/lib/print-workflow";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { applyStudentDiscount, getStudentDiscountPercent, isVerifiedStudent } from "@/lib/student-discount";
import type { UserAccount } from "@/types";
import type { ProductCatalogItem, ProductCategoryProperty } from "@/types/print-platform";
import { prisma } from "@/lib/prisma";

type CartPricingInput = {
  slug: string;
  name?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  config?: Record<string, string>;
  pricingConfig?: Record<string, string>;
  printCheckRequested?: boolean;
  printCheckFee?: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
};

export type PricedCartItem = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  normalUnitPrice: number;
  lineNormalPrice: number;
  lineFinalPrice: number;
  config: Record<string, string>;
  pricingConfig: Record<string, string>;
  printCheckRequested: boolean;
  printCheckFee: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
  embossingDesign?: {
    id: string;
    color: string;
    template: string;
    lineCount: number;
    previewUrl?: string | null;
    productionPdfUrl?: string | null;
  };
  production?: {
    binding?: BindingResolutionResult;
  };
  studentDiscount: {
    eligible: boolean;
    verified: boolean;
    percent: number;
    amount: number;
  };
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function safeLineQuantity(quantity: unknown) {
  const value = Number(quantity);
  return Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
}

function selectedOptionsFromItem(item: CartPricingInput) {
  const selectedOptions = { ...(item.pricingConfig ?? item.config ?? {}) };
  if (!selectedOptions.auflage && selectedOptions.Menge) selectedOptions.auflage = selectedOptions.Menge;
  return selectedOptions;
}

function configuredQuantity(selectedOptions: Record<string, string>) {
  return safeLineQuantity(selectedOptions.auflage ?? 1);
}

function publicUploadPath(uploadUrl?: string) {
  if (!uploadUrl || !uploadUrl.startsWith("/uploads/") || uploadUrl.includes("..") || uploadUrl.includes("\0")) return null;
  return path.join(process.cwd(), "public", uploadUrl.replace(/^\/+/, ""));
}

async function pageCountFromUploadedPdf(uploadUrl?: string, fileName?: string) {
  const lower = `${uploadUrl ?? ""} ${fileName ?? ""}`.toLowerCase();
  if (!lower.includes(".pdf")) return 0;
  const absolutePath = publicUploadPath(uploadUrl);
  if (!absolutePath) return 0;
  try {
    const bytes = await fs.readFile(absolutePath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return pdf.getPageCount();
  } catch {
    return 0;
  }
}

async function verifiedUploadedPdfPageCount(item: CartPricingInput, product: ProductCatalogItem) {
  const mode = product.pdfAnalysisMode ?? "disabled";
  if (mode === "disabled") return 0;
  const pageCount = await pageCountFromUploadedPdf(item.printCheckFileUrl, item.printCheckFileName);
  if (mode === "required" && pageCount <= 0) {
    throw new Error(`${product.name}: Bitte laden Sie eine gültige PDF hoch. Die PDF-Analyse ist für dieses Produkt erforderlich.`);
  }
  return pageCount;
}

function enabledCategoryProperties(product: ProductCatalogItem, categoryProperties: ProductCategoryProperty[]) {
  if (product.pricingProperties?.length) return [];
  const enabled = new Set(product.enabledCategoryProperties ?? []);
  if (!enabled.size) return [];
  return categoryProperties.filter((property) => enabled.has(property.name) && property.values.length > 0);
}

function calculateProductUnitPrice(product: ProductCatalogItem, quantity: number, selectedOptions: Record<string, string>, categoryProperties: ProductCategoryProperty[]) {
  if (product.pricingType === "tiered" || product.pricingType === "area" || product.pricingProperties?.length) {
    return calculateConfiguredProductPrice(product, quantity, selectedOptions, pricingQuantitiesForDocument(selectedOptions, quantity)).total;
  }
  const firstVariant = product.variants[0];
  const productPrice = firstVariant
    ? calculateVariantPrice(product, firstVariant.id, quantity, selectedOptions)
    : product.basePrice;
  return money(productPrice + calculateSelectedCategoryPropertiesPrice(enabledCategoryProperties(product, categoryProperties), quantity, selectedOptions));
}

export async function priceCartItems(params: {
  items: CartPricingInput[];
  user?: Pick<UserAccount, "id" | "studentVerification"> | null;
  studentDiscountPercent?: number | null;
}) {
  const [categories, globalProperties, bindingConfig] = await Promise.all([getCategories(), getGlobalProperties(), getProductionBindingConfig()]);
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const percent = getStudentDiscountPercent(params.studentDiscountPercent);
  const verified = isVerifiedStudent(params.user);
  const pricedItems: PricedCartItem[] = [];

  for (const item of params.items) {
    const rawProduct = await getPublicProductBySlug(item.slug);
    if (!rawProduct) throw new Error(`Produkt ${item.slug} ist nicht verfügbar.`);
    const product = resolveGlobalPropertyPricing(rawProduct, globalProperties);
    const pricingConfig = selectedOptionsFromItem(item);
    const verifiedPdfPageCount = await verifiedUploadedPdfPageCount(item, product);
    if (verifiedPdfPageCount > 0) {
      pricingConfig.seitenanzahl = String(verifiedPdfPageCount);
      pricingConfig.Seitenanzahl = String(verifiedPdfPageCount);
      pricingConfig["PDF-Seiten"] = String(verifiedPdfPageCount);
      pricingConfig["Seiten pro Exemplar"] = String(verifiedPdfPageCount);
      pricingConfig.pdfAnalysisStatus = "success";
      pricingConfig.pdfAnalysisPageCount = String(verifiedPdfPageCount);
      pricingConfig.pdfAnalysisFileUrl = item.printCheckFileUrl ?? pricingConfig.pdfAnalysisFileUrl ?? "";
      pricingConfig.pdfAnalysisFileName = item.printCheckFileName ?? pricingConfig.pdfAnalysisFileName ?? "";
    }
    const designId = pricingConfig.PraegungDesignId || pricingConfig.PraegungDesignID || pricingConfig.embossingDesignId;
    let embossingDesign: PricedCartItem["embossingDesign"] | undefined;
    if (designId) {
      if (!params.user?.id) throw new Error("Prägung erfordert ein angemeldetes Kundenkonto.");
      const design = await (prisma as any).embossingDesign.findFirst({
        where: { id: designId, userId: params.user.id, status: "finalized" }
      });
      if (!design) throw new Error("Finalisierte Prägung wurde nicht gefunden oder gehört nicht zu diesem Kundenkonto.");
      pricingConfig.resolvedEmbossingLineCount = String(design.lineCount);
      pricingConfig["Prägezeilen"] = String(design.lineCount);
      embossingDesign = {
        id: design.id,
        color: design.embossingColor,
        template: design.template,
        lineCount: design.lineCount,
        previewUrl: design.previewUrl,
        productionPdfUrl: design.productionPdfUrl
      };
    }
    const productQuantity = configuredQuantity(pricingConfig);
    const lineQuantity = safeLineQuantity(item.quantity);
    const categoryProperties = categoriesBySlug.get(product.category)?.properties ?? [];
    const bindingResolution = resolveBindingConfigurationForProduct({
      product,
      categoryProperties,
      config: pricingConfig,
      quantity: productQuantity,
      bindingSystems: bindingConfig.bindingSystems,
      bindingVariants: bindingConfig.bindingVariants
    });
    if (bindingResolution?.status === "resolved") {
      pricingConfig.resolvedBindingSystem = bindingResolution.bindingSystemId;
      pricingConfig.resolvedBindingSize = bindingResolution.sizeLabel ?? "";
      pricingConfig.resolvedBindingDiameterMm = String(bindingResolution.diameterMm ?? "");
      pricingConfig.resolvedBindingSpineWidthMm = String(bindingResolution.spineWidthMm ?? "");
      pricingConfig.resolvedBindingRingCount = String(bindingResolution.ringCount ?? "");
      pricingConfig.resolvedBindingSheetCount = String(bindingResolution.sheetCount);
      pricingConfig.resolvedBindingBlockThicknessMm = String(bindingResolution.blockThicknessMm);
      pricingConfig.resolvedBindingVariantId = bindingResolution.variantId ?? "";
      pricingConfig.resolvedBindingSku = bindingResolution.sku ?? "";
      pricingConfig.resolvedBindingSupplierArticle = bindingResolution.supplierArticleNumber ?? "";
    }
    const normalUnitPrice = calculateProductUnitPrice(product, productQuantity, pricingConfig, categoryProperties);
    const lineNormalPrice = money(normalUnitPrice * lineQuantity);
    const discountResult = applyStudentDiscount({ subtotal: lineNormalPrice, product, user: params.user, percent });
    const lineFinalPrice = discountResult.total;
    const unitPrice = money(lineFinalPrice / lineQuantity);
    pricedItems.push({
      slug: product.slug,
      name: product.name,
      category: product.category,
      quantity: lineQuantity,
      unitPrice,
      normalUnitPrice,
      lineNormalPrice,
      lineFinalPrice,
      config: item.config ?? {},
      pricingConfig,
      printCheckRequested: Boolean(item.printCheckRequested),
      printCheckFee: money(Number(item.printCheckFee ?? 0) || 0),
      printCheckFileName: item.printCheckFileName,
      printCheckFileUrl: item.printCheckFileUrl,
      embossingDesign,
      production: bindingResolution ? { binding: bindingResolution } : undefined,
      studentDiscount: {
        eligible: product.studentDiscountEligible !== false,
        verified,
        percent,
        amount: discountResult.discounts.find((discount) => discount.type === "student")?.amount ?? 0
      }
    });
  }

  const subtotalBeforeDiscount = money(pricedItems.reduce((sum, item) => sum + item.lineNormalPrice, 0));
  const studentDiscountTotal = money(pricedItems.reduce((sum, item) => sum + item.studentDiscount.amount, 0));
  const subtotalAfterDiscount = money(pricedItems.reduce((sum, item) => sum + item.lineFinalPrice, 0));

  return {
    items: pricedItems,
    subtotalBeforeDiscount,
    studentDiscountTotal,
    subtotalAfterDiscount,
    studentVerified: verified,
    studentDiscountPercent: percent
  };
}
