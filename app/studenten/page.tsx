import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileUp, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StructuredData } from "@/components/structured-data";
import { StudentPrintConfigurator } from "@/features/student/student-print-configurator";
import { getPublicProducts } from "@/lib/catalog-repository";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { getStudentArticles, studentLandingPages } from "@/lib/student-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abschlussarbeit drucken & binden in Wels | Studenten Druckservice",
  description: "Studenten Druckservice in Wels für Bachelorarbeit, Masterarbeit, Diplomarbeit, Skripten und Poster. PDF hochladen, Preis berechnen, abholen oder liefern lassen.",
  alternates: { canonical: "/studenten" },
  openGraph: {
    title: "Abschlussarbeit drucken & binden in Wels",
    description: "PDF hochladen, Druck und Bindung auswählen, Preis direkt sehen.",
    url: "/studenten",
    type: "website",
    locale: "de_AT"
  }
};

const decisionCards = [
  {
    title: "Abschlussarbeit",
    subtitle: "Bachelor · Master · Diplom · Dissertation",
    href: "/produkt/abschlussarbeiten",
    cta: "Abschlussarbeit konfigurieren",
    primary: true
  },
  {
    title: "Skripten & Lernunterlagen",
    subtitle: "SW oder Farbe · Duplex · Spiralbindung",
    href: "/produkt/spiralbindung",
    cta: "Skripten drucken"
  },
  {
    title: "Wissenschaftsposter",
    subtitle: "A2 · A1 · A0 · Großformat",
    href: "/produkt/plakate",
    cta: "Poster konfigurieren"
  },
  {
    title: "Seminar- & Projektarbeiten",
    subtitle: "Drucken · Binden · Mehrere Exemplare",
    href: "/produkt/abschlussarbeiten",
    cta: "Arbeit konfigurieren"
  }
] as const;

const bindingOptions = [
  {
    title: "Spiralbindung",
    label: "Praktisch",
    description: "Für Skripten, Seminararbeiten und Lernunterlagen.",
    slug: "spiralbindung",
    href: "/produkt/spiralbindung"
  },
  {
    title: "Klebebindung",
    label: "Modern",
    description: "Sauberer Buchrücken für Seminar- und Abschlussarbeiten.",
    slug: "abschlussarbeiten",
    href: "/produkt/abschlussarbeiten"
  },
  {
    title: "Hardcover",
    label: "Empfohlen",
    description: "Hochwertiger Einband für Abschlussarbeiten. Optional mit Gold- oder Silberprägung.",
    slug: "abschlussarbeiten",
    href: "/produkt/abschlussarbeiten",
    featured: true
  }
] as const;

const priceExamples = [
  {
    title: "Einfach",
    subtitle: "Spiralbindung",
    text: "Für Skripten, Seminararbeiten und Lernunterlagen.",
    slug: "spiralbindung",
    href: "/produkt/spiralbindung"
  },
  {
    title: "Beliebt",
    subtitle: "Hardcover",
    text: "Für Bachelor-, Master- und Diplomarbeiten.",
    slug: "abschlussarbeiten",
    href: "/produkt/abschlussarbeiten?studentPreset=hardcover"
  },
  {
    title: "Premium",
    subtitle: "Hardcover + Prägung",
    text: "Für finale Abgaben mit Gold- oder Silberprägung.",
    slug: "abschlussarbeiten",
    href: "/produkt/abschlussarbeiten?studentPreset=hardcover-praegung"
  }
] as const;

const benefits = [
  ["Preis sofort wissen", "PDF hochladen, Ausstattung wählen und Preis direkt sehen."],
  ["Alles aus einer Hand", "Druck, Bindung und Veredelung in einem Auftrag."],
  ["Lokal in Wels", "Online bestellen und bequem im Studio abholen."]
] as const;

function isRuntimeUploadImage(src?: string) {
  return Boolean(src?.startsWith("/uploads/"));
}

function SectionIntro({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase text-brand-blue">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#181818] md:text-5xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-[#6b6b6b] md:text-lg">{text}</p> : null}
    </div>
  );
}

function productMap(products: Awaited<ReturnType<typeof getPublicProducts>>) {
  return new Map(products.map((product) => [product.slug, product]));
}

export default async function StudentenPage() {
  const [products, articles] = await Promise.all([
    getPublicProducts(),
    getStudentArticles().catch(() => [])
  ]);
  const bySlug = productMap(products);
  const thesisProduct = bySlug.get("abschlussarbeiten") ?? products.find((product) => product.isStudentShop) ?? products[0];
  const thesisHref = thesisProduct ? `/produkt/${thesisProduct.slug}` : "/produkte";
  const thesisImage = thesisProduct?.heroImage || "/uploads/products/abschlussarbeiten.webp";
  const selectedGuides = [
    articles.find((article) => article.slug === "welche-bindung-bachelorarbeit"),
    articles.find((article) => article.slug === "pdf-fuer-druck-vorbereiten"),
    articles.find((article) => article.slug === "gold-silberpraegung-abschlussarbeit")
  ].filter(Boolean).slice(0, 3);

  return (
    <main className="bg-[#fafaf8] text-[#181818]">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Studenten Druckservice Wels",
        description: "Abschlussarbeiten, Skripten und Poster online konfigurieren, drucken und binden lassen.",
        url: "https://druck-und-design.at/studenten",
        inLanguage: "de-AT"
      }} />

      <section className="relative isolate overflow-hidden bg-[#181818] text-white">
        <Image
          src={thesisImage}
          alt="Professionell gebundene Abschlussarbeit"
          fill
          priority
          unoptimized={isRuntimeUploadImage(thesisImage)}
          className="absolute inset-0 -z-10 object-cover opacity-32"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="mx-auto grid min-h-[720px] w-[min(100%-48px,1200px)] items-end py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-white/75">Studenten Druckservice in Wels</p>
            <h1 className="mt-5 text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-normal">
              Alles für deine Abgabe.
              <br />
              Drucken, binden & fertig.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/82">
              Bachelorarbeit, Masterarbeit, Diplomarbeit, Skripten und Poster direkt online konfigurieren.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href={thesisHref}>Abschlussarbeit drucken <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
                <Link href="#studentenprodukte">Andere Studentenprodukte</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/78">
              {["PDF hochladen", "Preis sofort sehen", "Studentenrabatt", "Abholung in Wels"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="studentenprodukte" className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
        <SectionIntro eyebrow="Start" title="Was möchtest du drucken?" text="Wähle zuerst den Typ deiner Arbeit. Danach führt dich der bestehende Konfigurator zu Upload, Ausstattung, Preis und Bestellung." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {decisionCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={"primary" in card && card.primary
                ? "group rounded-[18px] border border-brand-blue bg-white p-6 transition hover:-translate-y-0.5"
                : "group rounded-[18px] border border-[#e8e8e5] bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-blue/40"}
            >
              <p className="text-2xl font-semibold leading-tight text-[#181818]">{card.title}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#6b6b6b]">{card.subtitle}</p>
              <p className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                {card.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8e5] bg-white">
        <div className="mx-auto grid w-[min(100%-48px,1200px)] gap-10 py-20 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-24">
          <div>
            <SectionIntro eyebrow="Abschlussarbeit" title="Deine Arbeit. Professionell gebunden." text="Vom PDF bis zur fertigen Bindung bleibt der Ablauf bewusst einfach." />
            <div className="mt-8 grid gap-4">
              {["PDF hochladen", "Ausstattung wählen", "Abholen oder liefern lassen"].map((step, index) => (
                <div key={step} className="flex items-center gap-4 border-t border-[#e8e8e5] pt-4">
                  <span className="text-sm font-semibold text-brand-blue">0{index + 1}</span>
                  <span className="text-lg font-semibold text-[#181818]">{step}</span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-9 bg-brand-blue hover:bg-brand-blue/90">
              <Link href={thesisHref}>Jetzt konfigurieren <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-[#e8e8e5] bg-[#fafaf8]">
            <Image
              src={thesisImage}
              alt="Hardcover Abschlussarbeit mit professioneller Bindung"
              fill
              unoptimized={isRuntimeUploadImage(thesisImage)}
              className="object-cover"
              sizes="(min-width: 900px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
        <SectionIntro eyebrow="PDF Quick Start" title="Du hast deine PDF schon fertig?" text="Lege deine Datei ab, lass Seiten und Format prüfen und springe direkt in die bestehende Konfiguration." />
        <div className="mt-8 overflow-hidden rounded-[18px] border border-[#e8e8e5] bg-white">
          <StudentPrintConfigurator products={products} />
        </div>
      </section>

      <section className="border-y border-[#e8e8e5] bg-white">
        <div className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
          <SectionIntro eyebrow="Bindung" title="Welche Bindung passt zu deiner Arbeit?" text="Die wichtigsten Optionen für Studium und Abgabe. Preise kommen aus den bestehenden Produktdaten." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {bindingOptions.map((option) => {
              const product = bySlug.get(option.slug) ?? thesisProduct;
              return (
                <Link
                  href={option.href}
                  key={option.title}
                  className={"featured" in option && option.featured
                    ? "rounded-[18px] border border-brand-blue bg-[#f8fbff] p-6 md:-mt-4 md:p-8"
                    : "rounded-[18px] border border-[#e8e8e5] bg-white p-6"}
                >
                  <span className="text-sm font-semibold text-brand-blue">{option.label}</span>
                  <h3 className="mt-4 text-2xl font-semibold text-[#181818]">{option.title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-[#6b6b6b]">{option.description}</p>
                  <p className="mt-6 text-sm font-semibold text-[#181818]">{product ? getProductStartingPriceLabel(product) : "Preis berechnen"}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
        <div className="grid gap-6 rounded-[18px] border border-[#e8e8e5] bg-white p-6 md:grid-cols-[1fr_1fr] md:p-10">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-blue">Studentenrabatt</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#181818] md:text-5xl">Student? Dann zahlst du weniger.</h2>
            <p className="mt-5 max-w-xl leading-7 text-[#6b6b6b]">Für Schüler und Studierende kann ein gültiger Nachweis erforderlich sein. Gruppen- und Klassendruck wird separat behandelt.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:content-center">
            <div className="rounded-[18px] border border-[#e8e8e5] bg-[#fafaf8] p-6">
              <p className="text-5xl font-semibold text-[#181818]">-20 %</p>
              <p className="mt-3 text-sm font-semibold text-[#6b6b6b]">für Schüler & Studierende</p>
            </div>
            <div className="rounded-[18px] border border-[#e8e8e5] bg-[#fafaf8] p-6">
              <p className="text-5xl font-semibold text-[#181818]">-25 %</p>
              <p className="mt-3 text-sm font-semibold text-[#6b6b6b]">bei Gruppen- oder Klassendruck</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e8e5] bg-white">
        <div className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
          <SectionIntro eyebrow="Preise" title="Was kostet meine Abschlussarbeit?" text="Die genaue Summe hängt von Seitenanzahl, Auflage, Papier, Bindung und Prägung ab. Deshalb führt dich der Konfigurator direkt zum echten Preis." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {priceExamples.map((example) => {
              const product = bySlug.get(example.slug);
              return (
                <Link key={example.title} href={example.href} className="rounded-[18px] border border-[#e8e8e5] bg-white p-6">
                  <p className="text-sm font-semibold uppercase text-brand-blue">{example.title}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-[#181818]">{example.subtitle}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-[#6b6b6b]">{example.text}</p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                    {product ? getProductStartingPriceLabel(product) : "Preis berechnen"}
                    <ArrowRight className="h-4 w-4" />
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map(([title, text]) => (
            <div key={title} className="rounded-[18px] border border-[#e8e8e5] bg-white p-6">
              <h3 className="text-xl font-semibold text-[#181818]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8e5] bg-white">
        <div className="mx-auto grid w-[min(100%-48px,1200px)] gap-8 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-24">
          <SectionIntro eyebrow="Oberösterreich" title="Für Studierende in Oberösterreich" text="Lokale Einstiege für Hochschulen und Studierende in Wels, Linz und Umgebung." />
          <div className="grid gap-3 sm:grid-cols-2">
            {studentLandingPages.map((page) => (
              <Link key={page.slug} href={`/studenten/${page.slug}`} className="flex items-center justify-between rounded-[14px] border border-[#e8e8e5] bg-[#fafaf8] px-4 py-4 font-semibold text-[#181818] hover:border-brand-blue/40">
                {page.title.replace("Studenten Druckservice für ", "").replace("Drucken und Binden für ", "")}
                <ArrowRight className="h-4 w-4 text-brand-blue" />
              </Link>
            ))}
            <Link href="/druckerei-wels" className="flex items-center justify-between rounded-[14px] border border-[#e8e8e5] bg-[#fafaf8] px-4 py-4 font-semibold text-[#181818] hover:border-brand-blue/40">
              Studenten in Wels
              <MapPin className="h-4 w-4 text-brand-blue" />
            </Link>
            <Link href="/druckerei-linz" className="flex items-center justify-between rounded-[14px] border border-[#e8e8e5] bg-[#fafaf8] px-4 py-4 font-semibold text-[#181818] hover:border-brand-blue/40">
              Studenten in Linz
              <MapPin className="h-4 w-4 text-brand-blue" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-48px,1200px)] py-20 md:py-24">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionIntro eyebrow="Ratgeber" title="Kurz nachlesen, sicher bestellen." text="Drei hilfreiche Artikel für Abgabe, PDF und Bindung." />
          <Button asChild variant="outline" className="w-fit">
            <Link href="/studenten/ratgeber">Alle Studenten-Ratgeber</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {selectedGuides.map((article) => article ? (
            <Link key={article.slug} href={`/studenten/ratgeber/${article.slug}`} className="rounded-[18px] border border-[#e8e8e5] bg-white p-6">
              <p className="text-sm font-semibold text-brand-blue">{article.category}</p>
              <h3 className="mt-4 text-xl font-semibold leading-snug text-[#181818]">{article.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6b6b6b]">{article.excerpt}</p>
            </Link>
          ) : null)}
        </div>
      </section>

      <section className="bg-[#181818] text-white">
        <div className="mx-auto grid w-[min(100%-48px,1200px)] gap-8 py-20 md:grid-cols-[1fr_auto] md:items-center md:py-24">
          <div>
            <h2 className="text-4xl font-semibold leading-tight md:text-6xl">Fertig geschrieben?</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">Dann kümmern wir uns um den Rest. PDF hochladen, Druck auswählen und Bestellung abschicken.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90">
              <Link href={thesisHref}>Jetzt drucken <FileUp className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
              <Link href="/kontakt">Beratung</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
