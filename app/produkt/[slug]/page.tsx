import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductConfigurator } from "@/features/configurator/product-configurator";
import { getProductBySlug } from "@/lib/catalog-repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produkt", description: product?.seo };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo,
    offers: { "@type": "Offer", priceCurrency: "EUR", price: product.basePrice, availability: "https://schema.org/InStock" }
  };

  return (
    <section className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="grid gap-4 md:grid-cols-[1fr_120px]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-brand-mist shadow-soft">
              <Image src={product.heroImage} alt={`${product.name} Demo-Mockup`} fill className="object-cover" priority sizes="(min-width: 1024px) 60vw, 100vw" />
            </div>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
              {product.gallery.map((image) => (
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted" key={image}>
                  <Image src={image} alt={`${product.name} Galerie`} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {product.rating} Kundenbewertung</div>
            <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{product.description}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Automatischer Datencheck Ihrer Vorlagen",
              "Fachliche Beratung zu Material und Veredelung",
              "Sonderformate und individuelle Wünsche auf Anfrage"
            ].map((feature) => <div className="rounded-lg border p-5 font-bold" key={feature}>{feature}</div>)}
          </div>
        </div>
        <ProductConfigurator product={product} />
      </div>
    </section>
  );
}
