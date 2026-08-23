import Link from "next/link";
import Image from "next/image";
import { promises as fs } from "fs";
import path from "path";
import { ArrowRight, CheckCircle2, GraduationCap, PhoneCall, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsMarquee } from "@/components/home/clients-marquee";
import { HeroBackgroundSlideshow } from "@/components/home/hero-background-slideshow";
import { ScrollZoomHero } from "@/components/home/scroll-zoom-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicCategories, getPublicIndustries, getPublicProducts } from "@/lib/catalog-repository";
import { StructuredData } from "@/components/structured-data";
import { ProductCard } from "@/components/product/product-card";
import { localBusinessJsonLd } from "@/lib/seo";
import { getSiteImageMap } from "@/lib/site-images";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { shopProductsFromCatalog } from "@/lib/shop-products";
import { prisma } from "@/lib/prisma";
import type { ProductCatalogItem } from "@/types/print-platform";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [platformCategories, industries, products, homepageLogos, siteImages, homepageSettings, reviewData] = await Promise.all([
    getPublicCategories(),
    getPublicIndustries(),
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
  const studentProducts = products
    .filter((product) => product.visible !== false && product.published !== false && product.isStudentShop)
    .sort((a, b) => Number(a.studentShopSortOrder ?? 999) - Number(b.studentShopSortOrder ?? 999))
    .slice(0, 4);
  const featuredIndustries = industries
    .filter((industry) => industry.featured)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
    .slice(0, 6);

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
      <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <HeroBackgroundSlideshow images={[siteImages["home.hero.1"], siteImages["home.hero.2"], siteImages["home.hero.3"]]} />
        <div className="container-page relative z-10 flex min-h-screen items-center py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-white/75">
              <span className="h-0.5 w-12 bg-brand-coral" />
              Design · Print · Digital
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[1.03] md:text-7xl">
              Druckerei, Werbetechnik & Werbeagentur in Wels
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">Design, Digitaldruck, Großformat, Beschriftung, Textildruck und Webdesign - von der Idee bis zur fertigen Umsetzung.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/produkte">Produkte entdecken <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-black/15 text-white hover:bg-black/35">
                <Link href="/kontakt">Angebot anfragen</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-black/15 text-white hover:bg-black/35">
                <Link href="/kontakt">Projekt starten</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ScrollZoomHero imageOverrides={{
        "/druckservice": siteImages["home.service.druckservice"],
        "/werbeagentur": siteImages["home.service.werbeagentur"],
        "/werbetechnik": siteImages["home.service.werbetechnik"],
        "/kleidung-textilien": siteImages["home.service.textildruck"]
      }} />

      {homepageSettings.bestsellerEnabled && bestsellerProducts.length ? (
        <section className="container-page py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow={homepageSettings.bestsellerSubtitle} title={homepageSettings.bestsellerTitle} description="Direkt aus dem Shop-Katalog, mit aktuellen Produktdaten und Preisen." />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/produkte">Alle Produkte ansehen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellerProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <Link href="/produkte" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-brand-blue hover:text-brand-ink">
            Alle Produkte ansehen <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      <section className="bg-[linear-gradient(180deg,#eef4ff,#f8fbff)] py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Kategorien" title="Was möchten Sie produzieren?" description="Druckprodukte, Werbetechnik, Textilien und digitale Leistungen direkt aus dem bestehenden Shop-Katalog." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformCategories.slice(0, 8).map((category) => (
              <Card key={category.slug} className="border border-border bg-card shadow-[0_12px_32px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:border-foreground/20 hover:shadow-premium">
                <CardContent className="p-5">
                  <Link href={`/${category.slug}`} className="block">
                    <h3 className="text-lg font-black">{category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {featuredIndustries.length ? (
        <section className="container-page py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow="Branchen" title="Lösungen für Ihre Branche" description="Schneller zur passenden Kombination aus Druck, Werbetechnik, Textil und Design." />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/branchen">Alle Branchen ansehen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featuredIndustries.map((industry) => {
              const heroImage = industry.heroImage || siteImages[`industry.${industry.slug}.hero`];
              return (
              <Card key={industry.slug} className="group overflow-hidden border border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.08)] transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-[0_24px_54px_rgba(17,85,204,.13)]">
                {heroImage ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-brand-mist">
                    <img src={heroImage} alt={industry.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-ink/45 to-transparent" />
                  </div>
                ) : null}
                <CardContent className="p-5">
                  <Link href={`/branchen/${industry.slug}`} className="block">
                    <h3 className="text-lg font-black text-brand-ink transition group-hover:text-brand-blue">{industry.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{industry.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
                      Lösungen ansehen <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {homepageSettings.studentShopEnabled ? (
        <section className="container-page py-16">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#ffffff_100%)] shadow-[0_18px_45px_rgba(17,34,68,.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
              <div className="p-7 md:p-10">
                <Badge variant="outline" className="border-brand-blue/20 bg-white text-brand-blue">Studenten Shop</Badge>
                <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight text-brand-ink md:text-5xl">{homepageSettings.studentShopTitle}</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{homepageSettings.studentShopDescription}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={homepageSettings.studentShopLink === "/studenten-shop" ? "/studenten" : homepageSettings.studentShopLink}>Studenten-Shop entdecken <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/kontakt">Beratung in Wels</Link>
                  </Button>
                </div>
                {studentProducts.length ? (
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {studentProducts.map((product) => (
                      <Link key={product.slug} href={`/produkt/${product.slug}`} className="rounded-md border border-white/80 bg-white/85 p-4 shadow-[0_10px_24px_rgba(17,34,68,.06)] transition hover:-translate-y-0.5 hover:border-brand-blue/30">
                        <p className="font-black text-brand-ink">{product.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{product.short}</p>
                        <p className="mt-2 text-sm font-black text-brand-blue">{getProductStartingPriceLabel(product)}</p>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="relative min-h-[300px] bg-brand-ink">
                <Image src={siteImages["home.student-shop"] || homepageSettings.studentShopImage || "/uploads/drucken.jpg"} alt="Studenten Shop Druckprodukte" fill className="object-cover opacity-90" sizes="(min-width: 1024px) 45vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/35 to-transparent" />
                <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-brand-ink shadow-lg">
                  <GraduationCap className="h-4 w-4 text-brand-blue" />
                  Abholung in Wels
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {homepageSettings.googleReviewsEnabled && (reviewData.totalCount > 0 || reviewData.fiveStarReviews.length > 0) ? (
        <section className="bg-slate-950 py-16 text-white">
          <div className="container-page">
            <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
              <div>
                <SectionHeading eyebrow={homepageSettings.googleReviewsSubtitle} title={homepageSettings.googleReviewsTitle} inverse />
                {reviewData.totalCount > 0 ? (
                  <div className="mt-6">
                    <div className="flex gap-1 text-brand-coral" aria-label={`${reviewData.averageRating.toFixed(1)} von 5 Sternen`}>
                      {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-5 w-5 fill-current" />)}
                    </div>
                    <p className="mt-3 text-2xl font-black">{reviewData.averageRating.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} von 5 bei Google</p>
                    <p className="mt-1 text-sm text-white/65">Basierend auf {reviewData.totalCount} Bewertungen</p>
                  </div>
                ) : null}
              </div>
              {reviewData.fiveStarReviews.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {reviewData.fiveStarReviews.slice(0, 3).map((review) => (
                    <Card key={review.id} className="border-white/10 bg-white/[.06] text-white shadow-none backdrop-blur">
                      <CardContent className="p-5">
                        <div className="flex gap-0.5 text-brand-coral" aria-label="5 von 5 Sternen">
                          {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-4 w-4 fill-current" />)}
                        </div>
                        <p className="mt-4 font-black">{review.customer}</p>
                        <p className="mt-3 line-clamp-5 text-sm leading-6 text-white/72">{review.comment}</p>
                        <div className="mt-5 flex items-center justify-between text-xs font-bold text-white/45">
                          <span>Google</span>
                          <span>{new Date(review.createdAt).toLocaleDateString("de-AT")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-page py-16">
        <SectionHeading eyebrow="Ablauf" title="So Läuft Ihr Projekt Mit Uns" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { step: "01", title: "Briefing & Beratung", text: "Wir klären Ziel, Format, Material und Budget." },
            { step: "02", title: "Design & Freigabe", text: "Sie erhalten Entwürfe und geben die Produktion frei." },
            { step: "03", title: "Produktion & Lieferung", text: "Wir produzieren sauber und liefern termingerecht aus." }
          ].map((item) => (
            <Card key={item.step} className="border border-border bg-card shadow-[0_16px_42px_rgba(15,23,42,.07)]">
              <CardContent className="p-6">
                <Badge variant="outline" className="text-xs font-bold tracking-[0.14em] text-muted-foreground">{item.step}</Badge>
                <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <Card className="border border-border bg-card text-card-foreground shadow-[0_20px_56px_rgba(15,23,42,.08)]">
          <CardContent className="p-8 md:p-12">
            <Badge variant="outline" className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Bereit Für Ihr Projekt?</Badge>
            <h2 className="mt-3 max-w-3xl text-4xl font-black text-foreground">Sie brauchen Druck, Werbetechnik oder Design? Wir beraten Sie direkt und starten sofort mit der Umsetzung.</h2>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {["Persönliche Beratung in Wels", "Klare Angebote ohne Umwege", "Verlässliche Produktionszeiten", "Ein Ansprechpartner für alles"].map((item) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground" key={item}>
                  <CheckCircle2 className="h-4 w-4 text-foreground/80" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent"><Link href="/kontakt"><PhoneCall className="h-4 w-4" /> Jetzt anfragen</Link></Button>
              <Button asChild variant="secondary"><Link href="/produkte">Produkte ansehen</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <ClientsMarquee logos={homepageLogos} />
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
