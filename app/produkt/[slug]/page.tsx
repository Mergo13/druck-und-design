import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductConfigurator } from "@/features/configurator/product-configurator";
import { getGlobalProperties, getPublicProductBySlug, getUserByEmail } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { prisma } from "@/lib/prisma";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { getStudentDiscountPercent, isVerifiedStudent } from "@/lib/student-discount";
import { studentProductHref } from "@/lib/student-products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  const canonical = product?.isStudentShop === true ? studentProductHref(product) : `/produkt/${slug}`;
  return {
    title: product ? `${product.name} online konfigurieren` : "Produkt",
    description: product?.seo,
    alternates: { canonical },
    openGraph: product ? {
      title: `${product.name} | druck&design studio`,
      description: product.seo,
      url: canonical,
      type: "website",
      locale: "de_AT",
      images: [{ url: product.heroImage, alt: product.name }]
    } : undefined
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawProduct = await getPublicProductBySlug(slug);
  if (!rawProduct) notFound();
  if (rawProduct.isStudentShop === true) redirect(studentProductHref(rawProduct));
  const session = await getSessionUser();
  const authenticated = Boolean(session);
  const [accountProfile, storeControl, globalProperties, approvedReviews] = await Promise.all([
    session?.email ? getUserByEmail(session.email).catch(() => null) : null,
    prisma.storeControlSetting.findUnique({ where: { id: "store-control" } }).catch(() => null),
    getGlobalProperties().catch(() => []),
    prisma.review.findMany({
      where: {
        published: true,
        productSlug: slug,
        rating: { gt: 0 }
      },
      select: { rating: true }
    }).catch(() => [])
  ]);
  const studentVerified = isVerifiedStudent(accountProfile);
  const studentDiscountPercent = getStudentDiscountPercent(storeControl?.studentDiscountPercent);
  const pricedProduct = resolveGlobalPropertyPricing(rawProduct, globalProperties);
  const product = authenticated ? pricedProduct : withoutPrices(pricedProduct);
  const reviewCount = approvedReviews.length;
  const averageRating = reviewCount
    ? approvedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewCount
    : 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo,
    image: product.heroImage,
    brand: { "@type": "Brand", name: "druck&design studio" },
    ...(reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount
      }
    } : {}),
    ...(authenticated ? { offers: { "@type": "Offer", priceCurrency: "EUR", price: product.basePrice, availability: "https://schema.org/InStock" } } : {})
  };

  const productImages = Array.from(new Set([product.heroImage, ...product.gallery].filter(Boolean)));

  return (
    <section className="container-page py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="max-w-3xl border-b border-slate-200 pb-7">
        <p className="text-sm font-bold text-brand-blue">Produkt konfigurieren</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{product.name}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">{product.short}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="order-2 lg:order-1">
          <ProductGallery images={productImages} name={product.name} />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <ProductConfigurator product={product} authenticated={authenticated} studentVerified={studentVerified} studentDiscountPercent={studentDiscountPercent} globalProperties={globalProperties} />
        </div>
      </div>

      <div className="mt-10 max-w-3xl border-t border-slate-200 pt-3">
        <details className="border-b border-slate-200 py-4">
          <summary className="cursor-pointer font-black text-brand-ink">Mehr Details</summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
        </details>
        <details className="border-b border-slate-200 py-4">
          <summary className="cursor-pointer font-black text-brand-ink">Druckdaten</summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">Druckdaten können direkt in der Konfiguration hochgeladen und geprüft werden.</p>
        </details>
        <details className="border-b border-slate-200 py-4">
          <summary className="cursor-pointer font-black text-brand-ink">Materialinformationen</summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">Verfügbare Materialien und Veredelungen werden passend zum Produkt in der Konfiguration angezeigt.</p>
        </details>
      </div>
    </section>
  );
}
