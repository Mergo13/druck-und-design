import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StructuredData } from "@/components/structured-data";
import { getPublicProducts } from "@/lib/catalog-repository";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { studentProductHref, studentProductsFromCatalog } from "@/lib/student-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schule & Studium | PDF hochladen, konfigurieren & bestellen",
  description: "Druckprodukte für Schule und Studium: PDF hochladen, Einstellungen wählen, Live-Preis sehen und online bestellen.",
  alternates: { canonical: "/studenten" },
  openGraph: {
    title: "Schule & Studium",
    description: "PDF hochladen, Einstellungen wählen und fertig.",
    url: "/studenten",
    type: "website",
    locale: "de_AT"
  }
};

function isRuntimeUploadImage(src?: string) {
  return Boolean(src?.startsWith("/uploads/"));
}

export default async function StudentenPage() {
  const products = studentProductsFromCatalog(await getPublicProducts());

  return (
    <main className="bg-[#fafaf8] text-[#181818]">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Schule & Studium",
        description: "PDF hochladen, Einstellungen wählen und Druckprodukte für Schule und Studium bestellen.",
        url: "https://druck-und-design.at/studenten",
        inLanguage: "de-AT"
      }} />

      <section className="border-b border-[#e8e8e5] bg-white">
        <div className="mx-auto grid min-h-[420px] w-[min(100%-32px,1180px)] gap-8 py-14 md:grid-cols-[1fr_360px] md:items-center md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-blue">Schule & Studium</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal md:text-7xl">Schule & Studium</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6b6b6b]">PDF hochladen, Einstellungen wählen und fertig.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href="#produkte">Produkt wählen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/studenten/ratgeber">Ratgeber</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-[#e8e8e5] bg-[#fafaf8] p-6">
            <FileUp className="h-10 w-10 text-brand-blue" />
            <div className="mt-6 grid gap-4">
              {["Produkt wählen", "PDF hochladen", "Preis sehen", "Bestellen"].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-brand-blue">{index + 1}</span>
                  <span className="font-semibold text-[#181818]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="produkte" className="mx-auto w-[min(100%-32px,1180px)] py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-brand-blue">Was möchtest du drucken?</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">Wähle dein Produkt.</h2>
        </div>
        {products.length ? (
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link key={product.slug} href={studentProductHref(product)} className="group overflow-hidden rounded-lg border border-[#e8e8e5] bg-white transition hover:-translate-y-0.5 hover:border-brand-blue/35 hover:shadow-sm">
                <div className="relative aspect-[4/3] bg-brand-mist">
                  {product.heroImage ? (
                    <Image src={product.heroImage} alt={product.name} fill unoptimized={isRuntimeUploadImage(product.heroImage)} className="object-cover transition group-hover:scale-[1.02]" sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-semibold leading-tight text-[#181818]">{product.name}</h3>
                    <span className="shrink-0 text-sm font-black text-brand-blue">{getProductStartingPriceLabel(product)}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6b6b6b]">{product.short}</p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                    Jetzt konfigurieren <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-[#e8e8e5] bg-white p-6 text-sm font-semibold text-[#6b6b6b]">
            Für diesen Bereich sind momentan keine Produkte verfügbar.
          </div>
        )}
      </section>
    </main>
  );
}
