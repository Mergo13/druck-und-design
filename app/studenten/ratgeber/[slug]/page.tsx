import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StructuredData } from "@/components/structured-data";
import { getPublicProducts } from "@/lib/catalog-repository";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import { getStudentArticleBySlug, getStudentArticles } from "@/lib/student-content";

export async function generateStaticParams() {
  const articles = await getStudentArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getStudentArticleBySlug(slug);
  return {
    title: article?.seoTitle || article?.title || "Studenten Ratgeber",
    description: article?.metaDescription || article?.excerpt,
    alternates: { canonical: article?.canonicalUrl || `/studenten/ratgeber/${slug}` },
    openGraph: article ? {
      title: article.title,
      description: article.excerpt,
      url: `/studenten/ratgeber/${slug}`,
      type: "article",
      locale: "de_AT",
      images: article.featuredImage ? [{ url: article.featuredImage, alt: article.title }] : undefined
    } : undefined
  };
}

export default async function StudentenArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, allArticles, products] = await Promise.all([
    getStudentArticleBySlug(slug),
    getStudentArticles(),
    getPublicProducts()
  ]);
  if (!article) notFound();

  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const relatedProducts = article.relatedProducts.map((productSlug) => productBySlug.get(productSlug)).filter(Boolean).slice(0, 3);
  const relatedArticles = article.relatedArticles.map((relatedSlug) => allArticles.find((item) => item.slug === relatedSlug)).filter(Boolean).slice(0, 3);
  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);
  const toc = paragraphs.slice(0, 4).map((paragraph, index) => ({
    id: `abschnitt-${index + 1}`,
    label: paragraph.slice(0, 68).replace(/[.:,;!?]\s*$/, "")
  }));

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studenten", item: "https://druck-und-design.at/studenten" },
      { "@type": "ListItem", position: 2, name: "Ratgeber", item: "https://druck-und-design.at/studenten/ratgeber" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://druck-und-design.at/studenten/ratgeber/${article.slug}` }
    ]
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage ? [article.featuredImage] : undefined,
    datePublished: article.publishDate,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "Druck & Design Studio" },
    publisher: { "@type": "Organization", name: "Druck & Design Studio" },
    inLanguage: "de-AT"
  };
  const faqSchema = article.faqs.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  } : null;

  return (
    <main>
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={articleSchema} />
      {faqSchema ? <StructuredData data={faqSchema} /> : null}
      <article className="container-page max-w-4xl py-10 md:py-16">
        <nav className="text-sm font-bold text-muted-foreground">
          <Link href="/studenten" className="hover:text-brand-blue">Studenten</Link>
          <span className="px-2">/</span>
          <Link href="/studenten/ratgeber" className="hover:text-brand-blue">Ratgeber</Link>
        </nav>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.14em] text-brand-blue">{article.category}</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-brand-ink md:text-6xl">{article.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{article.excerpt}</p>

        {article.featuredImage ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-brand-mist">
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" />
          </div>
        ) : null}

        {toc.length ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-brand-ink">Inhalt</p>
            <div className="mt-3 grid gap-2">
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="text-sm font-bold text-slate-600 hover:text-brand-blue">{item.label}</a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="prose prose-slate mt-8 max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p id={toc[index]?.id} key={index} className="scroll-mt-24 text-base leading-8 text-slate-700">{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 rounded-lg border-l-4 border-brand-blue bg-brand-mist p-5">
          <p className="font-black text-brand-ink">Kurz vor der Abgabe?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Lade deine PDF-Datei im bestehenden Produktkonfigurator hoch und wähle Bindung, Papier, Exemplare und Abholung oder Versand.</p>
        </div>

        {relatedProducts.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-brand-ink">Passende Produkte</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {relatedProducts.map((product) => product ? (
                <Card key={product.slug} className="border-slate-200">
                  <CardContent className="p-5">
                    <Link href={`/produkt/${product.slug}`} className="font-black text-brand-ink hover:text-brand-blue">{product.name}</Link>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.short}</p>
                    <p className="mt-3 text-sm font-black text-brand-blue">{getProductStartingPriceLabel(product)}</p>
                  </CardContent>
                </Card>
              ) : null)}
            </div>
          </section>
        ) : null}

        {article.faqs.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-brand-ink">FAQ</h2>
            <div className="mt-5 grid gap-3">
              {article.faqs.map((faq) => (
                <div key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="font-black text-brand-ink">{faq.question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {relatedArticles.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-brand-ink">Weiterlesen</h2>
            <div className="mt-5 grid gap-3">
              {relatedArticles.map((related) => related ? (
                <Link key={related.slug} href={`/studenten/ratgeber/${related.slug}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 font-black text-brand-ink hover:border-brand-blue/30 hover:text-brand-blue">
                  {related.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null)}
            </div>
          </section>
        ) : null}

        <div className="mt-12 rounded-lg bg-slate-950 p-7 text-white">
          <h2 className="text-2xl font-black">Druckauftrag starten</h2>
          <p className="mt-2 text-white/70">Konfiguriere Abschlussarbeit, Bindung oder Poster im bestehenden Shop.</p>
          <Button asChild className="mt-5"><Link href="/studenten">Zum Studenten-Shop</Link></Button>
        </div>
      </article>
    </main>
  );
}

