import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getStudentArticles, studentArticleCategories } from "@/lib/student-content";

export const metadata: Metadata = {
  title: "Studenten Ratgeber | Drucken, Binden & Druckdaten",
  description: "Ratgeber für Abschlussarbeiten, Bachelorarbeiten, Masterarbeiten, Bindungen, Poster und Druckdaten in Österreich.",
  alternates: { canonical: "/studenten/ratgeber" }
};

export default async function StudentenRatgeberPage() {
  const articles = await getStudentArticles();
  const featured = articles.filter((article) => article.featured).slice(0, 3);

  return (
    <main>
      <section className="bg-slate-950 py-20 text-white">
        <div className="container-page">
          <Badge variant="outline" className="border-white/25 bg-white/10 text-white">Studenten Ratgeber</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">Druckwissen für Studium und Abgabe</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Originale Tipps für Abschlussarbeiten, Skripten, Poster, Bindungen und PDF-Vorbereitung in Österreich.</p>
        </div>
      </section>

      {featured.length ? (
        <section className="container-page py-14">
          <SectionHeading eyebrow="Empfohlen" title="Wichtige Leitfäden" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((article) => <ArticleCard key={article.slug} article={article} featured />)}
          </div>
        </section>
      ) : null}

      <section className="bg-slate-50 py-14">
        <div className="container-page">
          <div className="flex flex-wrap gap-2">
            {studentArticleCategories.map((category) => (
              <span key={category} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{category}</span>
            ))}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>
    </main>
  );
}

function ArticleCard({ article, featured = false }: { article: Awaited<ReturnType<typeof getStudentArticles>>[number]; featured?: boolean }) {
  return (
    <Card className={featured ? "border-brand-blue/25 bg-white shadow-[0_18px_45px_rgba(17,85,204,.12)]" : "border-slate-200 bg-white shadow-sm"}>
      <CardContent className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-blue">{article.category}</p>
        <Link href={`/studenten/ratgeber/${article.slug}`} className="mt-3 block text-xl font-black leading-tight text-brand-ink hover:text-brand-blue">
          {article.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
          Lesen <ArrowRight className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}

