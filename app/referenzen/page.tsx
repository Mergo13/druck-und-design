import type { Metadata } from "next";
import Image from "next/image";
import { promises as fs } from "fs";
import path from "path";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Referenzen",
  description: "Kundenstimmen und Referenzen von druck&design studio."
};

export default async function ReferencesPage() {
  const [reviews, logos] = await Promise.all([getPublishedReviews(), getReferenceLogos()]);

  return (
    <section className="container-page py-12 md:py-16">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Referenzen</p>
      <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[1.04] text-brand-ink md:text-7xl">Arbeiten für Unternehmen, Vereine und Projekte aus der Region.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Ein Auszug aus Kundenlogos und veröffentlichten Bewertungen.</p>

      {logos.length ? (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {logos.slice(0, 18).map((logo) => (
            <div key={logo} className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(17,34,68,.06)]">
              <Image src={logo} alt="Kundenlogo" width={180} height={90} className="max-h-14 w-auto object-contain" />
            </div>
          ))}
        </div>
      ) : null}

      {reviews.length ? (
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <Card key={review.id} className="border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.07)]">
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-brand-coral" aria-label={`${review.rating} von 5 Sternen`}>
                  {Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 font-black text-brand-ink">{review.customer}</p>
                <p className="mt-3 line-clamp-6 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

async function getPublishedReviews() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 9
  }).catch(() => []);
  return reviews
    .filter((review) => review.comment?.trim())
    .map((review) => ({
      id: review.id,
      customer: review.customer,
      comment: review.comment,
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5))
    }));
}

async function getReferenceLogos() {
  const logosDir = path.join(process.cwd(), "public", "brand", "logos");
  try {
    const entries = await fs.readdir(logosDir, { withFileTypes: true });
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]);
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `/brand/logos/${file}`);
  } catch {
    return [];
  }
}
