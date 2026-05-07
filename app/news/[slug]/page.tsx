import { notFound } from "next/navigation";
import { posts } from "@/data/products";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();
  return (
    <article className="container-page max-w-3xl py-14">
      <p className="font-bold text-primary">{post.category}</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">{post.title}</h1>
      <p className="mt-4 text-muted-foreground">{post.author} · {post.date} · {post.readTime}</p>
      <p className="mt-8 text-xl leading-9 text-muted-foreground">{post.excerpt}</p>
      <div className="prose prose-slate mt-10 max-w-none">
        <p>Gute Druckprojekte beginnen mit klaren Zielen, sauberen Daten und einer Materialentscheidung, die zur Marke passt. Unser Team empfiehlt, jedes Produkt vom Einsatzort aus zu denken: Wird es verteilt, verschickt, getragen, ausgestellt oder archiviert?</p>
        <h2>Praktische Empfehlung</h2>
        <p>Nutzen Sie für wiederkehrende Kampagnen gespeicherte Vorlagen, prüfen Sie Beschnitt und Farbprofil vor dem Upload und planen Sie Express-Produktion nur für Produkte, bei denen alle Freigaben vollständig vorliegen.</p>
      </div>
    </article>
  );
}
