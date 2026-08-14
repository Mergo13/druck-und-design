import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Star, Sparkles, Image as ImageIcon, Layout, PenTool, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { MovingGridBackground } from "@/components/ui/moving-grid-background";

interface PortfolioItem {
  title: string;
  category: string;
  image: string;
}

interface ServiceFeature {
  icon: any;
  title: string;
  description: string;
}

interface ServicePortfolioPageProps {
  title: string;
  subtitle: string;
  description: string;
  features: ServiceFeature[];
  portfolio: PortfolioItem[];
  ctaLink?: string;
  ctaText?: string;
}

export function ServicePortfolioPage({
  title,
  subtitle,
  description,
  features,
  portfolio,
  ctaLink = "/produkte",
  ctaText = "Leistungen entdecken"
}: ServicePortfolioPageProps) {
  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <MovingGridBackground />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-blue blur-[120px]"></div>
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-brand-cyan blur-[120px]"></div>
        </div>
        
        <div className="container-page relative z-10">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-cyan">
              <Sparkles className="h-3.5 w-3.5" /> {subtitle}
            </span>
            <h1 className="text-5xl font-black leading-tight md:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              {description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-[#2d70b6]">
                <Link href={ctaLink}>{ctaText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/kontakt">Beratung anfordern</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container-page">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <div key={idx} className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-brand-blue/30 hover:shadow-premium">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio/Showcase */}
      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <SectionHeading 
            eyebrow="Referenzen" 
            title="Exzellenz in jedem Detail" 
            description="Entdecken Sie eine Auswahl unserer erfolgreich abgeschlossenen Projekte. Wir legen Wert auf höchste Qualität und individuelle Lösungen."
          />
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white shadow-soft transition-all hover:shadow-premium">
                <div className="aspect-[4/3] w-full bg-slate-200 relative">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan">{item.category}</span>
                  <h4 className="mt-1 text-lg font-bold text-white">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo/Effect Section */}
      <section className="container-page">
        <div className="overflow-hidden rounded-3xl bg-brand-blue p-8 text-white md:p-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-black">Erleben Sie druck&design live</h2>
              <p className="mt-6 text-lg text-blue-100">
                Wir nutzen modernste Technologien wie KI-gestützte Design-Assistenten und vollautomatisierte Druck-Workflows, um Ihr Projekt schneller und besser umzusetzen.
              </p>
              <div className="mt-10 space-y-4">
                {[
                  "Präzise Farbwiedergabe nach Industriestandards",
                  "Individuelle Materialberatung vor Ort",
                  "Schnelle Umsetzung durch optimierte Prozesse",
                  "KI-Unterstützung bei der Datenerstellung"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-cyan" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl border-4 border-white/10 bg-slate-900 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center transition-transform hover:scale-105">
                  <Sparkles className="mx-auto h-12 w-12 text-brand-cyan animate-pulse" />
                  <p className="mt-4 font-black tracking-[0.2em] uppercase text-sm">druck&design Experience</p>
                  <p className="text-xs text-slate-400 mt-2">Ihre Marke, unsere Umsetzung.</p>
                  <div className="mt-6 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1 w-8 rounded-full bg-brand-cyan/20 overflow-hidden">
                        <div 
                          className="h-full bg-brand-cyan animate-[shimmer_2s_infinite]" 
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Abstract decorative elements using real brand images as blurred backgrounds */}
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-blue/20 blur-3xl opacity-50" />
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-cyan/20 blur-3xl opacity-50" />
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-page text-center">
        <h2 className="text-3xl font-black md:text-4xl">Bereit für Ihr nächstes Projekt?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Ob Kleinauflage oder Großprojekt – wir begleiten Sie von der ersten Idee bis zum fertigen Produkt.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg" className="bg-brand-blue hover:bg-[#2d70b6]">
            <Link href={ctaLink}>{ctaText}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/kontakt">Jetzt anfragen</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
