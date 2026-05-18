import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { posts } from "@/data/products";

export const metadata: Metadata = { title: "News & Druckwissen", description: "Tipps zu Druckdaten, Marketing, Textildruck und Business Printing." };

export default function NewsPage() {
  return (
    <>
      <PageHero eyebrow="News & Wissen" title="Druckwissen für bessere Kampagnen" text="Praxisnahe Beiträge zu Druckdaten, Marketingmaterial, Textiltrends, SEO-Content und smarter Printproduktion." />
      <section className="container-page py-10">
        <div className="mb-8 flex items-center gap-3 rounded-lg border bg-white px-4 shadow-soft">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input suppressHydrationWarning className="h-12 flex-1 outline-none" placeholder="Beiträge durchsuchen" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <Link href={`/news/${post.slug}`} className="rounded-lg border p-6 shadow-soft transition hover:-translate-y-1" key={post.slug}>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{post.category}</span>
              <h2 className="mt-5 text-2xl font-black">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
              <p className="mt-6 text-sm font-bold">{post.author} · {post.readTime}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 rounded-lg bg-slate-950 p-8 text-white">
          <h2 className="text-3xl font-black">Print-Impulse direkt ins Postfach</h2>
          <p className="mt-2 text-white/70">Monatliche Tipps zu Druckdaten, Materialien und Kampagnenplanung.</p>
          <div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row"><input suppressHydrationWarning className="h-11 flex-1 rounded-md px-3 text-slate-950" placeholder="E-Mail-Adresse" /><button className="rounded-md bg-amber-400 px-5 font-bold text-slate-950">Abonnieren</button></div>
        </div>
      </section>
    </>
  );
}
