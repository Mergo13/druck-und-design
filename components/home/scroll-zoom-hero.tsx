"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const services: Array<{
  title: string;
  text: string;
  href: string;
  image: string;
}> = [
  {
    title: "Druckservice",
    text: "Flyer, Broschüren, Karten und Geschäftsdrucksorten in hochwertiger Produktion.",
    href: "/druckservice",
    image: "/uploads/drucken.jpg"
  },
  {
    title: "Werbeagentur",
    text: "Branding, Logos, Webdesign und Kampagnen für einen professionellen Unternehmensauftritt.",
    href: "/werbeagentur",
    image: "/uploads/werbeagentur.jpg"
  },
  {
    title: "Werbetechnik",
    text: "Banner, Schilder, Folien und Fahrzeugbeschriftung für sichtbare Marken im Alltag.",
    href: "/werbetechnik",
    image: "/uploads/werbetechnik.jpg"
  },
  {
    title: "Textildruck",
    text: "Arbeitskleidung, Teamwear und Merch mit langlebiger Veredelung und persönlicher Beratung.",
    href: "/kleidung-textilien",
    image: "/brand/images/tshirt.jpeg"
  }
];

export function ScrollZoomHero({ imageOverrides = {} }: { imageOverrides?: Record<string, string> }) {
  const serviceItems = services.map((service) => ({
    ...service,
    image: imageOverrides[service.href] ?? service.image
  }));
  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-8 max-w-3xl">
        <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Leistungen
        </Badge>
        <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl">Alles für einen professionellen Auftritt</h2>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">Vier Kompetenzbereiche, ein Ansprechpartner und Lösungen, die zu Ihrem Unternehmen passen.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {serviceItems.map(({ title, text, href, image }) => (
          <Card key={title} className="group overflow-hidden border border-border bg-card shadow-[0_14px_36px_rgba(15,23,42,.07)] transition-all hover:-translate-y-1 hover:border-foreground/20 hover:shadow-premium">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            </div>
            <CardContent className="p-6">
              <Link href={href} className="block">
                <h3 className="text-xl font-black text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-foreground">
                  Mehr erfahren <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
