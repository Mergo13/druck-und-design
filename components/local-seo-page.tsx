import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, MapPin, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StructuredData } from "@/components/structured-data";
import { companySeo, localBusinessJsonLd, type LocalSeoPage } from "@/lib/seo";

export function createLocalSeoMetadata(page: LocalSeoPage): Metadata {
  return {
    title: `${page.title} | Druck, Werbetechnik & Design`,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: `${page.title} | druck&design studio`,
      description: page.description,
      url: `/${page.slug}`,
      type: "website",
      locale: "de_AT"
    }
  };
}

export function LocalSeoPageView({ page }: { page: LocalSeoPage }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.description,
    provider: localBusinessJsonLd(),
    areaServed: { "@type": "AdministrativeArea", name: page.region },
    serviceType: page.services
  };

  return (
    <>
      <StructuredData data={schema} />
      <section className="bg-slate-950 text-white">
        <div className="container-page py-16 md:py-20">
          <p className="inline-flex border-l-4 border-brand-coral bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
            {page.region} · Oberösterreich
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{page.heading}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">{page.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/produkte">Produkte entdecken <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="border-white/40 bg-black/15 text-white hover:bg-black/35">
              <Link href="/kontakt">Angebot anfragen</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="container-page py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {page.services.map((service) => (
            <Card key={service} className="border border-border">
              <CardContent className="p-5">
                <CheckCircle2 className="h-5 w-5 text-brand-blue" />
                <h2 className="mt-3 text-lg font-black">{service}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Beratung, Druckdatencheck und Umsetzung passend zu Projekt, Material und Auflage.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="container-page pb-14">
        <div className="rounded-lg border bg-slate-50 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black">Beratung und Produktion aus Wels</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {companySeo.name} unterstützt Kunden in {page.region}, Wels, Linz, Linz-Land, Wels-Land und Eferding mit Druck, Werbetechnik, Textildruck und Design. Abholung und persönliche Beratung sind in Wels möglich.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin className="h-4 w-4 text-brand-blue" /> {companySeo.address.streetAddress}, {companySeo.address.postalCode} {companySeo.address.addressLocality}
              </p>
            </div>
            <Button asChild variant="accent"><Link href="/kontakt"><PhoneCall className="h-4 w-4" /> Projekt starten</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
