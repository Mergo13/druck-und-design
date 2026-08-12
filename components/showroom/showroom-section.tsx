import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { ShowroomImage } from "@/types/print-platform";

export function ShowroomSection({
  eyebrow = "Showroom",
  title,
  description,
  images
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  images: ShowroomImage[];
}) {
  const visibleImages = images.filter((item) => item.image && item.title);
  if (!visibleImages.length) return null;

  return (
    <section className="py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black text-brand-ink md:text-4xl">{title}</h2>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
        </div>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {visibleImages.slice(0, 6).map((item) => (
          <Card key={`${item.image}-${item.title}`} className="group overflow-hidden border-slate-200 bg-white shadow-[0_14px_38px_rgba(17,34,68,.08)] transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-[0_24px_54px_rgba(17,85,204,.13)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-brand-mist">
              <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-ink/55 to-transparent" />
            </div>
            <CardContent className="p-5">
              <h3 className="text-lg font-black text-brand-ink">{item.title}</h3>
              {item.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ServiceLinks({ links }: { links?: Array<{ label: string; href: string }> }) {
  const visibleLinks = (links ?? []).filter((item) => item.href && item.href !== "#");
  if (!visibleLinks.length) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {visibleLinks.map((link) => (
        <Link key={`${link.href}-${link.label}`} href={link.href} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-brand-ink shadow-[0_4px_14px_rgba(17,34,68,.06)] transition hover:border-brand-blue hover:bg-brand-mist hover:text-brand-blue">
          {link.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ))}
    </div>
  );
}
