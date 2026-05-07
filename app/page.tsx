import Link from "next/link";
import { ArrowRight, CheckCircle2, Factory, Layers3, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategories, getProducts } from "@/lib/catalog-repository";

export default async function HomePage() {
  const [platformCategories, productCatalog] = await Promise.all([getCategories(), getProducts()]);
  const workflowSteps: Array<{ icon: typeof Layers3; title: string; text: string }> = [
    { icon: Layers3, title: "Konfiguration", text: "Varianten, Attribute, Auflage und Preislogik live berechnen." },
    { icon: ShieldCheck, title: "Druckdatenprüfung", text: "Preflight-Regeln für Format, Auflösung, Beschnitt und Exportprofil." },
    { icon: Factory, title: "Produktionspipeline", text: "Automations-Jobs für Render, ERP-Sync, Nextcloud und Versand." }
  ];

  return (
    <>
      <section className="grid-bg overflow-hidden border-b bg-[linear-gradient(180deg,#f4f8fb,#ffffff)]">
        <div className="container-page grid min-h-[760px] items-center gap-12 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-white px-4 py-2 text-sm font-bold text-brand-blue shadow-soft">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
              AI Web-to-Print Plattform
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.03] text-brand-ink md:text-7xl">Druckproduktion neu gedacht. Digital, präzise, skalierbar.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Konfiguration, Datenprüfung, Design-Editor und Produktionsworkflow in einer modernen Plattform für professionelle Druckaufträge.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-[#2d70b6]">
                <Link href="/shop">Jetzt konfigurieren <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg"><Link href="/ki-design-assistent">Editor öffnen</Link></Button>
            </div>
          </div>
          <HeroSlideshow />
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Kategorien" title="Alle Kernbereiche für Ihre Print- und Marketingprozesse" description="Von Druckprodukten über Werbetechnik bis Direct Mailings: modular aufgebaut für skalierbare Produktion." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformCategories.map((category) => (
            <Link href={`/${category.slug}`} key={category.slug} className="rounded-lg border bg-white p-5 transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-premium">
              <h3 className="text-lg font-black">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-mist py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Bestseller" title="Produkte für tägliche B2B-Aufträge" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {productCatalog.map((product) => <ProductCard key={product.slug} product={product} />)}
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
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-200">Nächster Schritt</p>
          <h2 className="mt-2 max-w-3xl text-4xl font-black">Starten Sie mit einem Produkt oder bauen Sie Ihr Design direkt im Editor.</h2>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent"><Link href="/shop"><Workflow className="h-4 w-4" /> Shop öffnen</Link></Button>
            <Button asChild variant="secondary"><Link href="/ki-design-assistent">Personalisierungs-Editor</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
