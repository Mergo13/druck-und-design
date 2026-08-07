import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { ArrowRight, CheckCircle2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsMarquee } from "@/components/home/clients-marquee";
import { HeroBackgroundSlideshow } from "@/components/home/hero-background-slideshow";
import { ScrollZoomHero } from "@/components/home/scroll-zoom-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicCategories } from "@/lib/catalog-repository";
import { StructuredData } from "@/components/structured-data";
import { localBusinessJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const platformCategories = await getPublicCategories();
  const homepageLogos = await getHomepageLogos();

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
        <HeroBackgroundSlideshow />
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
                <Link href="/leistungen">Produkte entdecken <ArrowRight className="h-4 w-4" /></Link>
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

      <ScrollZoomHero />

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
              <Button asChild variant="secondary"><Link href="/leistungen">Leistungen ansehen</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <ClientsMarquee logos={homepageLogos} />
    </>
  );
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
