import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StructuredData } from "@/components/structured-data";
import { StudentConfigurator } from "@/features/student/student-print-configurator";
import { getGlobalProperties, getPublicProducts, getUserByEmail } from "@/lib/catalog-repository";
import { prisma } from "@/lib/prisma";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { getSessionUser } from "@/lib/auth";
import { getStudentDiscountPercent, isVerifiedStudent } from "@/lib/student-discount";
import { studentLandingPages } from "@/lib/student-content";
import { studentProductHref, studentProductsFromCatalog } from "@/lib/student-products";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const products = studentProductsFromCatalog(await getPublicProducts().catch(() => []));
  return [
    ...studentLandingPages.map((page) => ({ slug: page.slug })),
    ...products.map((product) => ({ slug: product.slug }))
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const products = studentProductsFromCatalog(await getPublicProducts().catch(() => []));
  const product = products.find((item) => item.slug === slug);
  const page = studentLandingPages.find((item) => item.slug === slug);
  return {
    title: product ? `${product.name} für Schule & Studium` : page ? `${page.title} | Druck & Design Studio` : "Schule & Studium",
    description: product?.seo || page?.description,
    alternates: { canonical: product ? studentProductHref(product) : page ? `/studenten/${page.slug}` : "/studenten" },
    openGraph: product ? {
      title: `${product.name} | Schule & Studium`,
      description: product.seo,
      url: studentProductHref(product),
      type: "website",
      locale: "de_AT",
      images: product.heroImage ? [{ url: product.heroImage, alt: product.name }] : undefined
    } : undefined
  };
}

export default async function StudentLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [publicProducts, globalProperties, session, storeControl] = await Promise.all([
    getPublicProducts(),
    getGlobalProperties().catch(() => []),
    getSessionUser().catch(() => null),
    prisma.storeControlSetting.findUnique({ where: { id: "store-control" } }).catch(() => null)
  ]);
  const studentProducts = studentProductsFromCatalog(publicProducts);
  const product = studentProducts.find((item) => item.slug === slug);

  if (product) {
    const accountProfile = session?.email ? await getUserByEmail(session.email).catch(() => null) : null;
    const pricedProduct = resolveGlobalPropertyPricing(product, globalProperties);
    return (
      <main>
        <StructuredData data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: pricedProduct.name,
          description: pricedProduct.seo,
          image: pricedProduct.heroImage,
          brand: { "@type": "Brand", name: "druck&design studio" }
        }} />
        <StudentConfigurator
          product={pricedProduct}
          authenticated={Boolean(session)}
          studentVerified={isVerifiedStudent(accountProfile)}
          studentDiscountPercent={getStudentDiscountPercent(storeControl?.studentDiscountPercent)}
        />
      </main>
    );
  }

  const page = studentLandingPages.find((item) => item.slug === slug);
  if (!page) notFound();

  return (
    <main className="bg-[#fafaf8]">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: `https://druck-und-design.at/studenten/${page.slug}`,
        inLanguage: "de-AT"
      }} />
      <section className="border-b border-[#e8e8e5] bg-white py-16 md:py-20">
        <div className="container-page">
          <p className="text-sm font-semibold uppercase text-brand-blue">Schule & Studium</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#181818] md:text-6xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6b6b6b]">{page.description}</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b6b6b]">Keine offizielle Partnerschaft oder Zugehörigkeit zu einer Hochschule wird behauptet.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href="#produkte">Produkte ansehen <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/studenten/ratgeber">Ratgeber lesen</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <h2 className="text-3xl font-semibold text-[#181818]">Einfach online starten</h2>
            <div className="mt-5 grid gap-3">
              {["Produkt wählen", "PDF hochladen", "Optionen prüfen", "Preis sehen"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-[#e8e8e5] bg-white p-4 font-semibold text-[#181818]">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div id="produkte">
            <h2 className="text-3xl font-semibold text-[#181818]">Produkte für Schule & Studium</h2>
            {studentProducts.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {studentProducts.map((item) => (
                  <Card key={item.slug} className="overflow-hidden border-[#e8e8e5] bg-white shadow-none">
                    {item.heroImage ? (
                      <div className="relative aspect-[16/9] bg-brand-mist">
                        <Image src={item.heroImage} alt={item.name} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                      </div>
                    ) : null}
                    <CardContent className="p-5">
                      <Link href={studentProductHref(item)} className="text-xl font-black text-brand-ink hover:text-brand-blue">{item.name}</Link>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.short}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-brand-blue">{getProductStartingPriceLabel(item)}</p>
                        <Link href={studentProductHref(item)} className="inline-flex items-center gap-2 text-sm font-black text-brand-blue">Konfigurieren <ArrowRight className="h-4 w-4" /></Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-[#e8e8e5] bg-white p-6 text-sm font-semibold text-[#6b6b6b]">
                Für diesen Bereich sind momentan keine Produkte verfügbar.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
