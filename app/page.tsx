import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import {
  ArrowRight,
  Copy,
  Layers3,
  Mail,
  Package,
  PanelsTopLeft,
  Shirt,
  Star,
  Sticker,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AiPrintAdvisor } from "@/components/home/ai-print-advisor";
import { HeroBackgroundSlideshow } from "@/components/home/hero-background-slideshow";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { StructuredData } from "@/components/structured-data";
import { ProductCard } from "@/components/product/product-card";
import { localBusinessJsonLd } from "@/lib/seo";
import { getSiteImageMap } from "@/lib/site-images";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { shopProductsFromCatalog } from "@/lib/shop-products";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const categoryIcons: Record<string, LucideIcon> = {
  druckprodukte: Layers3,
  werbetechnik: PanelsTopLeft,
  "kleidung-textilien": Shirt,
  aufkleber: Sticker,
  copyshop: Copy,
  "direct-mailings": Mail
};

const mainCategoryOrder = [
  "druckprodukte",
  "werbetechnik",
  "kleidung-textilien",
  "aufkleber",
  "copyshop",
  "direct-mailings"
];

export default async function HomePage() {
  const [platformCategories, products, homepageLogos, siteImages, homepageSettings, reviewData] = await Promise.all([
    getPublicCategories(),
    getPublicProducts(),
    getHomepageLogos(),
    getSiteImageMap(),
    getHomepageSettings(),
    getHomepageReviewData()
  ]);
  const shopProducts = shopProductsFromCatalog(products);
  const bestsellerProducts = shopProducts
    .filter((product) => product.visible !== false && product.published !== false && product.isBestseller)
    .sort((a, b) => Number(a.bestsellerSortOrder ?? 999) - Number(b.bestsellerSortOrder ?? 999))
    .slice(0, 4);
  const popularProducts = bestsellerProducts.length
    ? bestsellerProducts
    : shopProducts
      .filter((product) => product.visible !== false && product.published !== false)
      .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
      .slice(0, 4);
  const mainCategories = [...platformCategories]
    .filter((category) => mainCategoryOrder.includes(category.slug))
    .sort((a, b) => mainCategoryOrder.indexOf(a.slug) - mainCategoryOrder.indexOf(b.slug));

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://druck-und-design.at/#website",
          url: "https://druck-und-design.at/",
          name: "druck&design studio",
          inLanguage: "de-AT",
          publisher: localBusinessJsonLd()
        }}
      />
      <section className="relative min-h-[calc(100svh-7rem)] overflow-hidden bg-slate-950 text-white">
        <HeroBackgroundSlideshow images={[siteImages["home.hero.1"], siteImages["home.hero.2"], siteImages["home.hero.3"]]} />
        <div className="container-page relative z-10 flex min-h-[calc(100svh-7rem)] items-center py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-white/75">
              <span className="h-0.5 w-12 bg-brand-coral" />
              Design · Print · Digital
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[1.03] md:text-7xl">
              Druckerei, Werbetechnik & Werbeagentur in Wels
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">Design, Digitaldruck, Großformat, Beschriftung, Textildruck und Webdesign - von der Idee bis zur fertigen Umsetzung.</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/produkte">Produkte ansehen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Link href="/kontakt" className="text-sm font-bold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white">
                Beratung anfragen
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#eef4ff,#f8fbff)] py-14 md:py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Kategorien" title="Was möchten Sie produzieren?" description="Direkt zur passenden Produktgruppe." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mainCategories.map((category) => {
              const Icon = categoryIcons[category.slug] ?? Package;
              return (
                <Link
                  key={category.slug}
                  href={`/${category.slug}`}
                  className="group flex min-h-36 items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-premium"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-mist text-brand-blue">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-3 text-lg font-black text-brand-ink transition group-hover:text-brand-blue">
                      {category.name}
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">{category.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {homepageSettings.bestsellerEnabled && popularProducts.length ? (
        <section className="container-page py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow={homepageSettings.bestsellerSubtitle} title={homepageSettings.bestsellerTitle} description="Häufig bestellte Produkte auf einen Blick." />
            <Link href="/produkte" className="inline-flex w-fit items-center gap-2 text-sm font-black text-brand-blue hover:text-brand-ink">
              Alle Produkte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <AiPrintAdvisor />

      <section className="bg-slate-950 py-14 text-white md:py-16">
        <div className="container-page">
          {homepageSettings.googleReviewsEnabled && (reviewData.totalCount > 0 || reviewData.fiveStarReviews.length > 0) ? (
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <SectionHeading eyebrow={homepageSettings.googleReviewsSubtitle} title={homepageSettings.googleReviewsTitle} inverse />
                {reviewData.totalCount > 0 ? (
                  <div className="mt-6">
                    <div className="flex gap-1 text-brand-coral" aria-label={`${reviewData.averageRating.toFixed(1)} von 5 Sternen`}>
                      {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-5 w-5 fill-current" />)}
                    </div>
                    <p className="mt-3 text-2xl font-black">{reviewData.averageRating.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} von 5 bei Google</p>
                    <p className="mt-1 text-sm text-white/65">{reviewData.totalCount} Bewertungen</p>
                  </div>
                ) : null}
              </div>
              {reviewData.fiveStarReviews.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {reviewData.fiveStarReviews.slice(0, 2).map((review) => (
                    <Card key={review.id} className="border-white/10 bg-white/[.06] text-white shadow-none backdrop-blur">
                      <CardContent className="p-5">
                        <p className="font-black">{review.customer}</p>
                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/72">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <SectionHeading eyebrow="Referenzen" title="Unternehmen, die uns vertrauen" inverse />
          )}

          <div className="mt-10 flex items-center gap-8 overflow-x-auto border-t border-white/10 pt-8 [scrollbar-width:none]">
            {homepageLogos.map((src, index) => (
              <div key={`${src}-${index}`} className="flex h-14 w-32 shrink-0 items-center justify-center px-3">
                <img src={src} alt="Kundenlogo" className="max-h-10 w-full object-contain brightness-0 invert opacity-70" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-5">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-600">
          <span>Schnelle Produktion</span>
          <span className="hidden h-1 w-1 rounded-full bg-brand-coral sm:block" aria-hidden="true" />
          <span>Persönliche Beratung</span>
          <span className="hidden h-1 w-1 rounded-full bg-brand-coral sm:block" aria-hidden="true" />
          <span>Abholung in Wels</span>
        </div>
      </section>

    </>
  );
}

async function getHomepageReviewData() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);
  const ratedReviews = reviews.filter((review) => Number(review.rating) > 0);
  const averageRating = ratedReviews.length
    ? ratedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / ratedReviews.length
    : 0;
  const fiveStarReviews = reviews
    .filter((review) => Number(review.rating) === 5)
    .filter((review) => review.comment?.trim())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((review) => ({
      id: review.id,
      customer: review.customer,
      comment: review.comment,
      createdAt: review.createdAt.toISOString()
    }));
  return {
    averageRating,
    totalCount: ratedReviews.length,
    fiveStarReviews
  };
}

async function getHomepageLogos() {
  const logosDir = path.join(process.cwd(), "public", "brand", "logos");
  try {
    const entries = await fs.readdir(logosDir, { withFileTypes: true });
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]);
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (files.length) {
      return files.map((file) => `/brand/logos/${file}`);
    }
  } catch {
    // Fall back to defaults if folder does not exist yet.
  }

  return ["/brand/logo-dud.png"];
}
