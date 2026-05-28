import Link from "next/link";
import { ArrowRight, CheckCircle2, Factory, Layers3, PhoneCall, Printer, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategories } from "@/lib/catalog-repository";

export default async function HomePage() {
  const platformCategories = await getCategories();
const workflowSteps: Array<{ icon: typeof Layers3; title: string; text: string }> = [
  { icon: Layers3, title: "Konfiguration", text: "Varianten, Attribute, Auflage und Preislogik live berechnen." },
  { icon: ShieldCheck, title: "Druckdatenprüfung", text: "KI-gestützte Prüfung von Format, Auflösung und Beschnitt." },
  { icon: Factory, title: "Produktionspipeline", text: "Automatisierte Fertigung in Wels mit modernster Technik." }
];

  return (
    <>
      <section className="grid-bg overflow-hidden border-b bg-[linear-gradient(180deg,#f4f8fb,#ffffff)]">
        <div className="container-page grid min-h-[760px] items-center gap-12 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-white px-4 py-2 text-sm font-bold text-brand-blue shadow-soft">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
              Vision L&T – Druck & Design
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.03] text-brand-ink md:text-7xl">Ihre Ideen in Bestform. Präzise, Schnell, Visionär.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Wir sind Ihre Full-Service Werbeagentur und Druckerei in Wels. Von der Corporate Identity bis zum fertigen Printprodukt – alles aus einer Hand.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-[#2d70b6]">
                <Link href="/leistungen">Unsere Leistungen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg"><Link href="/referenzen">Referenzen ansehen</Link></Button>
            </div>
          </div>
          <HeroSlideshow />
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Dienstleistungen" title="Professionelle Lösungen für Ihren Erfolg" description="Vom ersten Entwurf bis zum fertigen Produkt – wir begleiten Sie mit Expertise und Leidenschaft." />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Link href="/druckservice" className="group rounded-2xl border bg-white p-8 transition-all hover:border-brand-blue/30 hover:shadow-premium">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
              <Printer className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black">Druckservice</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">High-End Printlösungen, Broschüren und Geschäftsausstattung in Spitzenqualität.</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-blue">
              Portfolio ansehen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/werbetechnik" className="group rounded-2xl border bg-white p-8 transition-all hover:border-brand-blue/30 hover:shadow-premium">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
              <Layers3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black">Werbetechnik</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Sichtbarkeit auf jedem Format: Banner, Schilder und Fahrzeugbeklebung.</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-blue">
              Projekte entdecken <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/werbeagentur" className="group rounded-2xl border bg-white p-8 transition-all hover:border-brand-blue/30 hover:shadow-premium">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black">Werbeagentur</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Kreative Konzepte, Logo-Design und strategisches Marketing für Ihre Marke.</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-blue">
              Referenzen ansehen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      <section className="bg-brand-mist py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Kategorien" title="Unsere Kompetenzbereiche" description="Entdecken Sie unsere vielfältigen Lösungen für Ihre Werbemittel und Druckprodukte." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformCategories.slice(0, 8).map((category) => (
              <Link href={`/${category.slug}`} key={category.slug} className="rounded-lg border bg-white p-5 transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-premium">
                <h3 className="text-lg font-black">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Workflow" title="Von Entwurf bis Produktion ohne Medienbruch" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {workflowSteps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border p-6 shadow-soft">
              <Icon className="h-7 w-7 text-brand-blue" />
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-cyan">Vertrauen</p>
            <h2 className="mt-2 text-4xl font-black">Enterprise-ready für modernes Printgeschäft</h2>
          </div>
          <div className="grid gap-4">
            {["API-ready Architektur für Order Pipeline und Kundenprojekte", "Modulare Basis für AI-Designhilfen und Personalisierung", "Infrastruktur vorbereitet für Queue-Systeme und ERP-Integration", "Skalierbare Foundation für Docker und Nextcloud-Workflows"].map((item) => (
              <div className="flex items-start gap-3" key={item}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-lg bg-[linear-gradient(135deg,#0f172a,#115e59)] p-8 text-white md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-200">Bereit für Ihr Projekt?</p>
          <h2 className="mt-2 max-w-3xl text-4xl font-black">Lassen Sie uns gemeinsam Ihre Vision realisieren. Kontaktieren Sie uns für ein unverbindliches Erstgespräch.</h2>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent"><Link href="/kontakt"><PhoneCall className="h-4 w-4" /> Jetzt anfragen</Link></Button>
            <Button asChild variant="secondary"><Link href="/referenzen">Referenzen entdecken</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
