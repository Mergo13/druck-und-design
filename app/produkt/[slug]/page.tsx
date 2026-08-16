import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductConfigurator } from "@/features/configurator/product-configurator";
import { getGlobalProperties, getPublicProductBySlug, getUserByEmail } from "@/lib/catalog-repository";
import { CheckCircle2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { formatProductDeliveryText } from "@/lib/product-delivery";
import { withoutPrices } from "@/lib/product-price-visibility";
import { prisma } from "@/lib/prisma";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { getStudentDiscountPercent, isStudentDiscountEligibleProduct, isVerifiedStudent } from "@/lib/student-discount";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  return {
    title: product ? `${product.name} online konfigurieren` : "Produkt",
    description: product?.seo,
    alternates: { canonical: `/produkt/${slug}` },
    openGraph: product ? {
      title: `${product.name} | druck&design studio`,
      description: product.seo,
      url: `/produkt/${slug}`,
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
  const session = await getSessionUser();
  const authenticated = Boolean(session);
  const [accountProfile, storeControl, globalProperties] = await Promise.all([
    session?.email ? getUserByEmail(session.email).catch(() => null) : null,
    prisma.storeControlSetting.findUnique({ where: { id: "store-control" } }).catch(() => null),
    getGlobalProperties().catch(() => [])
  ]);
  const studentVerified = isVerifiedStudent(accountProfile);
  const studentDiscountPercent = getStudentDiscountPercent(storeControl?.studentDiscountPercent);
  const studentDiscountEligible = isStudentDiscountEligibleProduct(rawProduct);
  const pricedProduct = resolveGlobalPropertyPricing(rawProduct, globalProperties);
  const product = authenticated ? pricedProduct : withoutPrices(pricedProduct);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo,
    image: product.heroImage,
    brand: { "@type": "Brand", name: "druck&design studio" },
    ...(authenticated ? { offers: { "@type": "Offer", priceCurrency: "EUR", price: product.basePrice, availability: "https://schema.org/InStock" } } : {})
  };

  const productImages = Array.from(new Set([product.heroImage, ...product.gallery].filter(Boolean)));

  return (
    <section className="container-page py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="grid gap-6">
          <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.rating} Kundenbewertung
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{formatProductDeliveryText(product.deliveryText)}</span>
              {authenticated && studentVerified && studentDiscountEligible ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">✓ Studentenstatus verifiziert · {studentDiscountPercent} % Studentenrabatt</span>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{product.name}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{product.description}</p>
            </div>
          </div>
          <ProductGallery images={productImages} name={product.name} />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Profi-Datencheck", desc: "Automatischer Check Ihrer Vorlagen auf Druckfähigkeit" },
              { title: "Fachberatung", desc: "Beratung zu Material und Veredelung durch Experten" },
              { title: "Individualität", desc: "Sonderformate und Wünsche auf Anfrage möglich" }
            ].map((feature) => (
              <div className="motion-elevate flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={feature.title}>
                <div className="flex items-center gap-2 font-black text-slate-950">
                  <CheckCircle2 className="h-5 w-5" />
                  {feature.title}
                </div>
                <div className="text-sm leading-relaxed text-slate-600">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-24">
          <ProductConfigurator product={product} authenticated={authenticated} studentVerified={studentVerified} studentDiscountPercent={studentDiscountPercent} />
        </div>
      </div>
    </section>
  );
}
