import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getStudentArticleProfile, getStudentArticles, studentArticleTopicClusters } from "@/lib/student-content";

export const metadata: Metadata = {
  title: "Studenten Ratgeber | Abschlussarbeit, PDF, Bindung & Preise",
  description: "Ratgeber für Bachelorarbeit, Masterarbeit, Skripten und Poster: PDF vorbereiten, Bindung wählen, Preise verstehen und in Wels bestellen.",
  alternates: { canonical: "/studenten/ratgeber" },
  openGraph: {
    title: "Studenten Ratgeber: Drucken, Binden, PDF & Preise",
    description: "Klare Leitfäden für Abschlussarbeiten, Skripten, Poster und Druckdaten mit direktem Weg zum passenden Produkt.",
    url: "/studenten/ratgeber",
    type: "website",
    locale: "de_AT"
  }
};

export default async function StudentenRatgeberPage() {
  const articles = await getStudentArticles();
  const commercialArticles = articles
    .filter((article) => {
      const intent = getStudentArticleProfile(article).searchIntent;
      return intent === "transactional" || intent === "commercial" || intent === "local";
    })
    .slice(0, 4);
  const featured = articles.filter((article) => article.featured).slice(0, 3);
  const articlesByCluster = studentArticleTopicClusters.map((cluster) => ({
    ...cluster,
    articles: articles.filter((article) => cluster.categories.includes(article.category)).slice(0, 5)
  })).filter((cluster) => cluster.articles.length);

  return (
    <main className="bg-[#fafaf8]">
      <section className="border-b border-[#e8e8e5] bg-white py-20">
        <div className="container-page">
          <Badge variant="outline" className="border-brand-blue/20 bg-brand-mist text-brand-blue">Studenten Ratgeber</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#181818] md:text-6xl">Drucken, binden und abgeben. Ohne Rätselraten.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6b6b6b]">Klare Leitfäden für Bachelorarbeit, Masterarbeit, Skripten, Poster und druckfertige PDFs. Jeder Ratgeber führt dich zum passenden Produkt und zur echten Preisberechnung.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studenten" className="inline-flex h-11 items-center justify-center rounded-md bg-brand-blue px-5 text-sm font-bold text-white transition hover:bg-[#2c70b8]">
              Produkt wählen
            </Link>
            <Link href="/studenten" className="inline-flex h-11 items-center justify-center rounded-md border border-[#e8e8e5] bg-white px-5 text-sm font-bold text-[#181818] transition hover:border-brand-blue/35 hover:text-brand-blue">
              Studentenservice ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {commercialArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} compact />
          ))}
        </div>
      </section>

      {featured.length ? (
        <section className="container-page border-t border-[#e8e8e5] py-14">
          <SectionHeading eyebrow="Top-Ratgeber" title="Wichtige Entscheidungen vor dem Druck" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((article) => <ArticleCard key={article.slug} article={article} featured />)}
          </div>
        </section>
      ) : null}

      <section className="border-y border-[#e8e8e5] bg-white py-14">
        <div className="container-page">
          <SectionHeading eyebrow="Themen" title="Nach Aufgabe sortiert" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studentArticleTopicClusters.map((cluster) => (
              <a key={cluster.title} href={`#${cluster.title.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "und")}`} className="rounded-lg border border-[#e8e8e5] bg-[#fafaf8] p-5 transition hover:border-brand-blue/35">
                <h2 className="text-lg font-black text-[#181818]">{cluster.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">{cluster.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-10">
          {articlesByCluster.map((cluster) => (
            <div key={cluster.title} id={cluster.title.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "und")} className="scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-brand-blue">{cluster.title}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#181818]">{cluster.description}</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cluster.articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e8e8e5] bg-white py-14">
        <div className="container-page grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-blue">Direkt bestellen</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#181818]">PDF fertig? Dann berechne den Preis mit deiner echten Datei.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6b6b]">Der Produktkonfigurator übernimmt Seitenanzahl, Auflage, Druckart, Bindung und Datei-Upload in einem Ablauf.</p>
          </div>
          <Link href="/studenten" className="inline-flex h-11 items-center justify-center rounded-md bg-brand-blue px-5 text-sm font-bold text-white transition hover:bg-[#2c70b8]">
            PDF hochladen & Preis berechnen
          </Link>
        </div>
      </section>
    </main>
  );
}

function ArticleCard({ article, featured = false, compact = false }: { article: Awaited<ReturnType<typeof getStudentArticles>>[number]; featured?: boolean; compact?: boolean }) {
  const profile = getStudentArticleProfile(article);

  return (
    <Card className={featured ? "border-brand-blue/25 bg-white shadow-[0_18px_45px_rgba(17,85,204,.10)]" : "border-[#e8e8e5] bg-white shadow-none"}>
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-blue">{article.category}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{profile.searchIntent}</span>
        </div>
        <Link href={`/studenten/ratgeber/${article.slug}`} className={compact ? "mt-3 block text-lg font-black leading-tight text-brand-ink hover:text-brand-blue" : "mt-3 block text-xl font-black leading-tight text-brand-ink hover:text-brand-blue"}>
          {article.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
          {profile.ctaLabel} <ArrowRight className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}
