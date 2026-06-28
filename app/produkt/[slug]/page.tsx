import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductConfigurator } from "@/features/configurator/product-configurator";
import { getPublicProductBySlug } from "@/lib/catalog-repository";
import { CheckCircle2 } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  return { title: product?.name ?? "Produkt", description: product?.seo };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
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
          <ProductGallery images={[product.heroImage, ...product.gallery]} name={product.name} />
          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {product.rating} Kundenbewertung
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{product.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{product.description}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Profi-Datencheck", desc: "Automatischer Check Ihrer Vorlagen auf Druckfähigkeit" },
              { title: "Fachberatung", desc: "Beratung zu Material und Veredelung durch Experten" },
              { title: "Individualität", desc: "Sonderformate und Wünsche auf Anfrage möglich" }
            ].map((feature) => (
              <div className="glass-panel motion-elevate flex flex-col gap-2 rounded-xl p-5" key={feature.title}>
                <div className="flex items-center gap-2 font-black text-brand-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  {feature.title}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <ProductConfigurator product={product} />
      </div>
    </section>
  );
}
