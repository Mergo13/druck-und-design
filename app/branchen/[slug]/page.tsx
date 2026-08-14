import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, PhoneCall, Star } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ServiceLinks, ShowroomSection } from "@/components/showroom/showroom-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicIndustries, getPublicIndustryBySlug, getPublicProducts } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { prisma } from "@/lib/prisma";
import { getSiteImageMap } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const industries = await getPublicIndustries();
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [industry, siteImages] = await Promise.all([getPublicIndustryBySlug(slug), getSiteImageMap()]);
  if (!industry) return { title: "Branche" };
  const heroImage = industry.heroImage || siteImages[`industry.${industry.slug}.hero`];
  return {
    title: industry.seoTitle || `${industry.name} | druck&design studio`,
    description: industry.metaDescription || industry.description,
    alternates: { canonical: `/branchen/${industry.slug}` },
    openGraph: {
      title: industry.seoTitle || industry.name,
      description: industry.metaDescription || industry.description,
      url: `/branchen/${industry.slug}`,
      type: "website",
      locale: "de_AT",
      images: heroImage ? [{ url: heroImage }] : undefined
    }
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [industry, rawProducts, session, siteImages] = await Promise.all([
    getPublicIndustryBySlug(slug),
    getPublicProducts(),
    getSessionUser(),
    getSiteImageMap()
  ]);
  if (!industry) notFound();

  const authenticated = Boolean(session);
  const industryHeroImage = industry.heroImage || siteImages[`industry.${industry.slug}.hero`];
  const showroomImages = (industry.showroomImages ?? []).map((item, index) => ({
    ...item,
    image: item.image || siteImages[`industry.${industry.slug}.showroom.${index + 1}`]
  }));
  const linkedProductSlugs = new Set(industry.productSlugs ?? []);
  const relatedRawProducts = rawProducts
    .filter((product) => linkedProductSlugs.has(product.slug) || (product.industrySlugs ?? []).includes(industry.slug))
    .slice(0, 6);
  const relatedProducts = authenticated ? relatedRawProducts : relatedRawProducts.map(withoutPrices);
  const references = await getIndustryReferences(relatedRawProducts.map((product) => product.slug));

  return (
    <section className="pb-16">
      <div className="relative min-h-[430px] overflow-hidden bg-brand-ink text-white">
        {industryHeroImage ? <img src={industryHeroImage} alt={industry.name} className="absolute inset-0 h-full w-full object-cover opacity-40" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/86 to-brand-ink/40" />
        <div className="grid-bg absolute inset-0 opacity-15" />
        <div className="container-page relative z-10 grid min-h-[430px] items-end py-14">
          <div className="max-w-4xl">
            <Link href="/branchen" className="text-sm font-black text-white/70 transition hover:text-white">Branchen</Link>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] md:text-7xl">{industry.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">{industry.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/kontakt"><PhoneCall className="h-4 w-4" /> Projekt anfragen</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
                <Link href="/produkte">Produkte ansehen</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-12">
        {industry.solutionGroups?.length ? (
          <section>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Bedarf & Lösungen</p>
            <h2 className="mt-2 text-3xl font-black text-brand-ink md:text-4xl">Was Kunden aus dieser Branche brauchen</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {industry.solutionGroups.map((group) => (
                <Card key={group.title} className="border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.07)]">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-black text-brand-ink">{group.title}</h3>
                    <div className="mt-4 grid gap-2">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <ShowroomSection
          title={`${industry.name} Showroom`}
          description="Beispiele für typische Anwendungen, Materialien und Auftritte."
          images={showroomImages}
        />

        {relatedProducts.length ? (
          <section className="py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Produkte</p>
                <h2 className="mt-2 text-3xl font-black text-brand-ink md:text-4xl">Passende Produkte</h2>
              </div>
              <Button asChild variant="outline" className="w-fit">
                <Link href="/produkte">Alle Produkte ansehen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((product) => (
                <ProductCard key={product.slug} product={product} showPrices={authenticated} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="py-12">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Leistungen</p>
          <h2 className="mt-2 text-3xl font-black text-brand-ink md:text-4xl">Passende Services</h2>
          <ServiceLinks links={industry.serviceLinks} />
        </section>

        {references.length ? (
          <section className="py-12">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Referenzen</p>
            <h2 className="mt-2 text-3xl font-black text-brand-ink md:text-4xl">Kundenstimmen</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {references.map((review) => (
                <Card key={review.id} className="border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.07)]">
                  <CardContent className="p-5">
                    <div className="flex gap-0.5 text-brand-coral">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-4 w-4 fill-current" />)}</div>
                    <p className="mt-4 font-black text-brand-ink">{review.customer}</p>
                    <p className="mt-3 line-clamp-5 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-lg bg-brand-ink p-8 text-white md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-coral">Nächster Schritt</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">Wir stellen die passende Produktkombination für {industry.name} zusammen.</h2>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/kontakt">Beratung anfragen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
              <Link href="/branchen">Weitere Branchen</Link>
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}

async function getIndustryReferences(productSlugs: string[]) {
  if (!productSlugs.length) return [];
  const reviews = await prisma.review.findMany({
    where: {
      published: true,
      productSlug: { in: productSlugs },
      rating: { gte: 4 }
    },
    orderBy: { createdAt: "desc" },
    take: 3
  }).catch(() => []);
  return reviews
    .filter((review) => review.comment?.trim())
    .map((review) => ({
      id: review.id,
      customer: review.customer,
      comment: review.comment
    }));
}
