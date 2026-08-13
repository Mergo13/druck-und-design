import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeEuro, BookOpen, CheckCircle2, Clock, FileUp, GraduationCap, MapPin, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StructuredData } from "@/components/structured-data";
import { getPublicProducts } from "@/lib/catalog-repository";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studenten Druckservice in Wels | Abschlussarbeiten, Skripten & Poster",
  description: "Abschlussarbeiten, Skripten, Poster und Bindungen schnell und professionell in Wels drucken. Studentenrabatt mit gültigem Studentenausweis.",
  alternates: { canonical: "/studenten" },
  openGraph: {
    title: "Studenten Druckservice in Wels",
    description: "Abschlussarbeiten, Skripten, Poster und Bindungen schnell & professionell drucken.",
    url: "/studenten",
    type: "website",
    locale: "de_AT"
  }
};

const categoryCards = [
  ["Bachelorarbeit", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Masterarbeit", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Diplomarbeit", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Dissertation / Doktorarbeit", "dissertation-drucken-binden", "/studenten/ratgeber/dissertation-drucken-binden"],
  ["Abschlussarbeit allgemein", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Seminararbeit", "spiralbindung", "/produkt/spiralbindung"],
  ["Projektarbeit", "spiralbindung", "/produkt/spiralbindung"],
  ["Skripten & Lernunterlagen", "skripten-guenstig-drucken-binden", "/studenten/ratgeber/skripten-guenstig-drucken-binden"],
  ["Wissenschaftsposter", "plakate", "/produkt/plakate"],
  ["Plakate A0 / A1 / A2", "plakate", "/produkt/plakate"],
  ["Präsentationen", "magazine", "/produkt/magazine"],
  ["Broschüren", "magazine", "/produkt/magazine"],
  ["Spiralbindung", "spiralbindung", "/produkt/spiralbindung"],
  ["Klebebindung", "welche-bindung-bachelorarbeit", "/studenten/ratgeber/welche-bindung-bachelorarbeit"],
  ["Softcover", "hardcover-oder-softcover", "/studenten/ratgeber/hardcover-oder-softcover"],
  ["Hardcover", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Gold-/Silberprägung", "gold-silberpraegung-abschlussarbeit", "/studenten/ratgeber/gold-silberpraegung-abschlussarbeit"]
] as const;

const benefits = [
  [BadgeEuro, "Studentenpreise"],
  [Clock, "Schnelle Produktion"],
  [FileUp, "PDF-Datei hochladen"],
  [MapPin, "Abholung in Wels"],
  [Truck, "Versand möglich"],
  [BookOpen, "Persönliche Beratung"],
  [PackageCheck, "Hochwertiger Digitaldruck"],
  [GraduationCap, "Hardcover & Softcover"],
  [CheckCircle2, "Gold-/Silber-Veredelung"]
] as const;

const bindingCards = [
  ["Spiralbindung", "Affordable and practical.", "spiralbindung", "/produkt/spiralbindung"],
  ["Klebebindung", "Clean professional finish.", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Softcover", "Lightweight premium option.", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Hardcover", "Premium solution for Bachelor-, Master- and Diplomarbeiten.", "abschlussarbeiten", "/produkt/abschlussarbeiten"],
  ["Hardcover + Gold/Silber", "Premium presentation option.", "abschlussarbeiten", "/produkt/abschlussarbeiten"]
] as const;

function productMap(products: Awaited<ReturnType<typeof getPublicProducts>>) {
  return new Map(products.map((product) => [product.slug, product]));
}

function isRuntimeUploadImage(src: string) {
  return src.startsWith("/uploads/");
}

export default async function StudentenPage() {
  const products = await getPublicProducts();
  const bySlug = productMap(products);
  const thesisProduct = bySlug.get("abschlussarbeiten") ?? products.find((product) => product.isStudentShop) ?? products[0];
  const thesisImage = thesisProduct?.heroImage || "/uploads/products/abschlussarbeiten.webp";
  const thesisHref = thesisProduct ? `/produkt/${thesisProduct.slug}` : "/produkte";
  const studentProducts = products
    .filter((product) => product.isStudentShop || ["abschlussarbeiten", "spiralbindung", "plakate", "magazine"].includes(product.slug))
    .sort((a, b) => Number(a.studentShopSortOrder ?? 999) - Number(b.studentShopSortOrder ?? 999))
    .slice(0, 8);

  return (
    <main className="bg-white">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Studenten Druckservice in Wels",
        description: "Abschlussarbeiten, Skripten, Poster und Bindungen schnell & professionell drucken.",
        url: "https://druck-und-design.at/studenten",
        inLanguage: "de-AT"
      }} />
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <Image src={thesisImage} alt="Studenten Druckservice in Wels" fill priority unoptimized={isRuntimeUploadImage(thesisImage)} className="object-cover opacity-45" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/25" />
        </div>
        <div className="container-page relative py-24 md:py-32">
          <Badge variant="outline" className="border-white/25 bg-white/10 text-white">Studenten-Shop</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">Studenten Druckservice in Wels</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">Abschlussarbeiten, Skripten, Poster und Bindungen schnell & professionell drucken.</p>
          <div className="mt-7 inline-flex rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-black text-brand-ink shadow-lg">
            Studentenrabatt mit gültigem Studentenausweis
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={thesisHref}>Jetzt bestellen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
              <Link href="#preise">Preise ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Studenten-Shop" title="Was möchtest du drucken oder binden?" description="Direkte Einstiege in bestehende Produkte und passende Ratgeberseiten." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map(([label, key, href]) => {
            const product = bySlug.get(key);
            const safeHref = href.startsWith("/produkt/") && !product ? "/produkte" : href;
            return (
              <Link key={label} href={safeHref} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(17,34,68,.06)] transition hover:-translate-y-1 hover:border-brand-blue/35 hover:shadow-[0_18px_40px_rgba(17,85,204,.12)]">
                <p className="text-lg font-black text-brand-ink transition group-hover:text-brand-blue">{label}</p>
                <p className="mt-3 text-sm font-bold text-brand-blue">{product ? getProductStartingPriceLabel(product) : "Ratgeber öffnen"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Konfigurator" title="Abschlussarbeit konfigurieren" description="Der Ablauf führt direkt in den bestehenden Produkt-Konfigurator mit Upload, Preisberechnung, Warenkorb und Checkout." />
            <div className="mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-2">
              {["PDF upload", "format", "pages", "color / black-white", "single/double-sided", "paper", "binding", "cover color", "optional gold/silver finishing", "copies", "production time", "pickup/shipping", "calculated price", "add to cart"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  {item}
                </div>
              ))}
            </div>
            <Button asChild className="mt-8">
              <Link href={thesisHref}>Konfigurator starten <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <Card className="overflow-hidden border-slate-200 shadow-[0_18px_45px_rgba(17,34,68,.08)]">
            <div className="relative aspect-[4/3] bg-brand-mist">
              <Image src={thesisImage} alt="Abschlussarbeiten drucken und binden" fill unoptimized={isRuntimeUploadImage(thesisImage)} className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </Card>
        </div>
      </section>

      <section id="preise" className="container-page py-16">
        <SectionHeading eyebrow="Bindungen" title="Bindungen im Vergleich" description="Preise und Konfigurationen kommen aus den bestehenden Produkten." />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {bindingCards.map(([title, text, slug, href]) => {
            const product = bySlug.get(slug) ?? thesisProduct;
            const productImage = product?.heroImage || "/uploads/products/abschlussarbeiten.webp";
            const safeHref = bySlug.get(slug) ? href : thesisHref;
            return (
              <Card key={title} className="overflow-hidden border-slate-200 bg-white shadow-[0_12px_32px_rgba(17,34,68,.06)]">
                <div className="relative aspect-[4/3] bg-brand-mist">
                  <Image src={productImage} alt={title} fill unoptimized={isRuntimeUploadImage(productImage)} className="object-cover" sizes="(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw" />
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-black text-brand-ink">{title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{text}</p>
                  <p className="mt-4 text-sm font-black text-brand-blue">{product ? getProductStartingPriceLabel(product) : "Preis auf Anfrage"}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{product?.deliveryText || "Produktionszeit im Produkt wählbar"}</p>
                  <Button asChild className="mt-5 w-full">
                    <Link href={safeHref}>Konfigurieren</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Vorteile" title="Alles für Studium und Abgabe" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-white bg-white/85 p-4 shadow-sm">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-blue text-white"><Icon className="h-5 w-5" /></span>
                <p className="font-black text-brand-ink">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <SectionHeading eyebrow="Ablauf" title="In 3 Schritten bestellen" />
          <div className="grid gap-4 md:grid-cols-3">
            {["Datei hochladen", "Druck & Bindung konfigurieren", "Abholen oder liefern lassen"].map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-brand-blue">0{index + 1}</p>
                <h3 className="mt-3 text-lg font-black text-brand-ink">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {studentProducts.length ? (
        <section className="bg-slate-50 py-16">
          <div className="container-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeading eyebrow="Produkte" title="Passende Studenten-Produkte" />
              <Button asChild variant="outline" className="w-fit"><Link href="/produkte">Alle Produkte ansehen</Link></Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {studentProducts.map((product) => (
                <Link key={product.slug} href={`/produkt/${product.slug}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_32px_rgba(17,34,68,.06)] transition hover:-translate-y-1 hover:border-brand-blue/30">
                  <div className="relative aspect-[4/3] bg-brand-mist">
                    <Image src={product.heroImage} alt={product.name} fill unoptimized={isRuntimeUploadImage(product.heroImage)} className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-brand-ink group-hover:text-brand-blue">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.short}</p>
                    <p className="mt-3 text-sm font-black text-brand-blue">{getProductStartingPriceLabel(product)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-page py-16">
        <div className="rounded-lg bg-slate-950 p-8 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black">Bereit für den Druck?</h2>
              <p className="mt-3 max-w-2xl text-white/75">Starte mit dem bestehenden Produktkonfigurator oder lies den Ratgeber für Druckdaten, Bindungen und Abgabeplanung.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild><Link href={thesisHref}>Jetzt bestellen</Link></Button>
              <Button asChild variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20"><Link href="/studenten/ratgeber">Ratgeber öffnen</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
