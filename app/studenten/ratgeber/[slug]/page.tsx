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
import { getStudentArticleBySlug, getStudentArticleProfile, getStudentArticles } from "@/lib/student-content";

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
  const profile = getStudentArticleProfile(article);
  const primaryProduct = productBySlug.get(profile.targetProductSlug) ?? productBySlug.get(article.relatedProducts[0] ?? "");
  const relatedProducts = article.relatedProducts.map((productSlug) => productBySlug.get(productSlug)).filter(Boolean).slice(0, 3);
  const relatedArticles = article.relatedArticles.map((relatedSlug) => allArticles.find((item) => item.slug === relatedSlug)).filter(Boolean).slice(0, 3);
  const blocks = parseArticleBody(article.body);
  const headings = blocks.filter((block): block is Extract<ArticleBodyBlock, { type: "heading" }> => block.type === "heading").slice(0, 5);
  const toc = headings.map((heading) => ({ id: heading.id, label: heading.text }));

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
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-brand-blue/20 bg-brand-mist px-3 py-1 text-xs font-black uppercase text-brand-blue">{profile.searchIntent}</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{profile.primaryKeyword}</span>
        </div>

        {article.featuredImage ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-brand-mist">
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" />
          </div>
        ) : null}

        {primaryProduct ? (
          <div className="mt-8 rounded-lg border border-brand-blue/20 bg-brand-mist p-5 md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">{profile.conversionGoal}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-ink">{primaryProduct.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{primaryProduct.short}</p>
            </div>
            <Button asChild className="mt-4 shrink-0 md:mt-0">
              <Link href={`/produkt/${primaryProduct.slug}`}>{profile.ctaLabel}</Link>
            </Button>
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

        <div className="mt-8 grid gap-6">
          {blocks.map((block, index) => <ArticleBodyBlockView key={`${block.type}-${index}`} block={block} />)}
        </div>

        <div className="mt-10 rounded-lg border-l-4 border-brand-blue bg-brand-mist p-5">
          <p className="font-black text-brand-ink">Nächster Schritt</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Lade deine PDF-Datei im bestehenden Produktkonfigurator hoch. Seitenanzahl, Auflage, Druckart, Papier und Bindung fließen dort in die echte Preisberechnung ein.</p>
          {primaryProduct ? (
            <Link href={`/produkt/${primaryProduct.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
              {profile.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
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
          <p className="mt-2 text-white/70">{primaryProduct ? `${primaryProduct.name} direkt konfigurieren und mit deiner PDF den Preis berechnen.` : "Konfiguriere Abschlussarbeit, Bindung oder Poster im bestehenden Shop."}</p>
          <Button asChild className="mt-5"><Link href={primaryProduct ? `/produkt/${primaryProduct.slug}` : "/studenten"}>{primaryProduct ? profile.ctaLabel : "Zum Studenten-Shop"}</Link></Button>
        </div>
      </article>
    </main>
  );
}

type ArticleBodyBlock =
  | { type: "heading"; id: string; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseArticleBody(body: string): ArticleBodyBlock[] {
  return body.split(/\n{2,}/).filter(Boolean).map((rawBlock, index) => {
    const block = rawBlock.trim();
    if (block.startsWith("## ")) {
      return {
        type: "heading",
        id: `abschnitt-${index + 1}`,
        text: block.replace(/^##\s+/, "").trim()
      };
    }
    if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
      return {
        type: "list",
        items: block.split("\n").map((line) => line.trim().replace(/^-\s+/, "")).filter(Boolean)
      };
    }
    return { type: "paragraph", text: block };
  });
}

function ArticleBodyBlockView({ block }: { block: ArticleBodyBlock }) {
  if (block.type === "heading") {
    return <h2 id={block.id} className="scroll-mt-24 text-2xl font-black leading-tight text-brand-ink">{block.text}</h2>;
  }
  if (block.type === "list") {
    return (
      <ul className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-base leading-8 text-slate-700">{block.text}</p>;
}
