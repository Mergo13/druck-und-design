import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicIndustries } from "@/lib/catalog-repository";
import { getSiteImageMap } from "@/lib/site-images";

export const metadata: Metadata = {
  title: "Lösungen für Branchen",
  description: "Druck, Werbetechnik und Designlösungen für Bau, Gastronomie, Praxen, Industrie, Handel, Vereine und weitere Branchen."
};

export default async function IndustriesOverviewPage() {
  const [industries, siteImages] = await Promise.all([getPublicIndustries(), getSiteImageMap()]);

  return (
    <section className="pb-16">
      <div className="relative overflow-hidden bg-brand-ink text-white">
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="container-page relative py-16 md:py-20">
          <p className="inline-flex border-l-4 border-brand-coral bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">Branchen</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">Lösungen für Ihre Branche</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">Produkte, Werbetechnik und Design passend zu Ihrem Arbeitsalltag, ohne doppelte Katalogpflege.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/kontakt">Projekt besprechen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
              <Link href="/produkte">Produkte ansehen</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Card key={industry.slug} className="group overflow-hidden border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.08)] transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-[0_24px_54px_rgba(17,85,204,.13)]">
              {siteImages[`industry.${industry.slug}.hero`] || industry.heroImage ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-brand-mist">
                  <img src={siteImages[`industry.${industry.slug}.hero`] ?? industry.heroImage} alt={industry.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-ink/45 to-transparent" />
                </div>
              ) : null}
              <CardContent className="p-6">
                <Link href={`/branchen/${industry.slug}`} className="block">
                  <h2 className="text-xl font-black text-brand-ink transition group-hover:text-brand-blue">{industry.name}</h2>
                  <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{industry.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
                    Lösungen ansehen <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
