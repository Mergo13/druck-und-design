import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StructuredData } from "@/components/structured-data";
import { getPublicProducts } from "@/lib/catalog-repository";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { studentLandingPages } from "@/lib/student-content";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return studentLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = studentLandingPages.find((item) => item.slug === slug);
  return {
    title: page ? `${page.title} | Druck & Design Studio` : "Studenten Druckservice",
    description: page?.description,
    alternates: { canonical: page ? `/studenten/${page.slug}` : "/studenten" }
  };
}

export default async function StudentLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = studentLandingPages.find((item) => item.slug === slug);
  if (!page) notFound();
  const products = await getPublicProducts();
  const related = products.filter((product) => ["abschlussarbeiten", "spiralbindung", "plakate", "magazine"].includes(product.slug)).slice(0, 4);
  const thesisProduct = products.find((product) => product.slug === "abschlussarbeiten") ?? related[0] ?? products[0];
  const thesisHref = thesisProduct ? `/produkt/${thesisProduct.slug}` : "/studenten";

  return (
    <main>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: `https://druck-und-design.at/studenten/${page.slug}`,
        inLanguage: "de-AT"
      }} />
      <section className="bg-slate-950 py-20 text-white">
        <div className="container-page">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Studenten Druckservice</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{page.description}</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">Keine offizielle Partnerschaft oder Zugehörigkeit zu einer Hochschule wird behauptet.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href={thesisHref}>Abschlussarbeit konfigurieren <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20"><Link href="/studenten/ratgeber">Ratgeber lesen</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black text-brand-ink">Häufig gesucht</h2>
            <div className="mt-5 grid gap-3">
              {page.searchFocus.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 font-bold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-brand-ink">Passende Produkte</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {related.map((product) => (
                <Card key={product.slug} className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-5">
                    <Link href={`/produkt/${product.slug}`} className="font-black text-brand-ink hover:text-brand-blue">{product.name}</Link>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.short}</p>
                    <p className="mt-3 text-sm font-black text-brand-blue">{getProductStartingPriceLabel(product)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
