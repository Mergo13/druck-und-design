import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { ArrowRight, CheckCircle2, Layers3, PhoneCall, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/flipwords";
import { ClientsMarquee } from "@/components/home/clients-marquee";
import { HeroBackgroundSlideshow } from "@/components/home/hero-background-slideshow";
import { HighlightCarousel } from "@/components/home/highlight-carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategories } from "@/lib/catalog-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const platformCategories = await getCategories();
  const homepageLogos = await getHomepageLogos();
  const services: Array<{ icon: typeof Printer; title: string; text: string; href: string }> = [
    { icon: Printer, title: "Druckservice", text: "Flyer, Broschüren, Karten und Geschäftsdrucksorten in hochwertiger Produktion.", href: "/druckservice" },
    { icon: Layers3, title: "Werbetechnik", text: "Banner, Schilder, Roll-ups und Fahrzeugbeschriftung für starke Sichtbarkeit.", href: "/werbetechnik" },
    { icon: Sparkles, title: "Werbeagentur", text: "Logo, Corporate Design und Kampagnenmaterial für einen klaren Markenauftritt.", href: "/werbeagentur" }
  ];

  return (
    <>
      <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <HeroBackgroundSlideshow />
        <div className="container-page relative z-10 flex min-h-screen items-center py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/12 px-4 py-2 text-sm font-bold shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
              druck&design studio
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.03] md:text-7xl">
              <span className="block">Moderne</span>
              <FlipWords
                words={["Druckservice", "Werbetechnik", "Werbeagentur", "Textildruck"]}
                duration={2600}
                className="!px-0 !text-brand-cyan"
              />
              <span className="block">für Unternehmen.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">Wir verkaufen hochwertige Printprodukte, sichtbare Werbetechnik und kreatives Design, damit Ihr Auftritt professionell wirkt und Ergebnisse bringt.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/leistungen">Jetzt Leistungen ansehen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-black/15 text-white hover:bg-black/35">
                <Link href="/kontakt">Projekt anfragen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Dienstleistungen" title="Was Wir Für Sie Umsetzen" description="Klarer Fokus auf Verkauf, Sichtbarkeit und professionelle Markenwirkung." />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {services.map(({ icon: Icon, title, text, href }) => (
            <Link href={href} key={title} className="group rounded-lg border border-white/80 bg-[linear-gradient(180deg,#fff,#f8fbff)] p-8 shadow-[0_18px_46px_rgba(15,23,42,.08)] transition-all hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-premium">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-brand-blue/15 bg-white text-brand-blue shadow-sm transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-blue">
                Mehr erfahren <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      <section className="container-page py-12">
        <HighlightCarousel />
      </section>

      <section className="bg-[linear-gradient(180deg,#eef4ff,#f8fbff)] py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Kategorien" title="Unsere Kompetenzbereiche" description="Entdecken Sie unsere vielfältigen Lösungen für Ihre Werbemittel und Druckprodukte." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformCategories.slice(0, 8).map((category) => (
              <Link href={`/${category.slug}`} key={category.slug} className="rounded-lg border border-white/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-premium">
                <h3 className="text-lg font-black">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
              </Link>
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
            <div key={item.step} className="rounded-lg border border-white/80 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,.07)]">
              <p className="text-xs font-bold tracking-[0.14em] text-brand-blue">{item.step}</p>
              <h3 className="mt-2 text-xl font-black">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-lg bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0891b2)] p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,.28)] md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-cyan-200">Bereit Für Ihr Projekt?</p>
          <h2 className="mt-2 max-w-3xl text-4xl font-black">Sie brauchen Druck, Werbetechnik oder Design? Wir beraten Sie direkt und starten sofort mit der Umsetzung.</h2>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {["Persönliche Beratung in Wels", "Klare Angebote ohne Umwege", "Verlässliche Produktionszeiten", "Ein Ansprechpartner für alles"].map((item) => (
              <div className="flex items-center gap-2 text-sm" key={item}>
                <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent"><Link href="/kontakt"><PhoneCall className="h-4 w-4" /> Jetzt anfragen</Link></Button>
            <Button asChild variant="secondary"><Link href="/leistungen">Leistungen ansehen</Link></Button>
          </div>
        </div>
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
