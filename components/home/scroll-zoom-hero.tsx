"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers3, Printer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const panels = [
  {
    title: "DRUCK & COPY",
    subtitle: "Schnell, sauber, professionell",
    href: "/druckservice",
    image: "/uploads/drucken.jpg"
  },
  {
    title: "WERBEAGENTUR",
    subtitle: "Design, Branding und Kampagnen",
    href: "/werbeagentur",
    image: "/uploads/werbeagentur.jpg"
  },
  {
    title: "WERBETECHNIK",
    subtitle: "Sichtbarkeit für Ihr Unternehmen",
    href: "/werbetechnik",
    image: "/uploads/werbetechnik.jpg"
  }
];

const services: Array<{
  icon: typeof Printer;
  title: string;
  text: string;
  href: string;
}> = [
  {
    icon: Printer,
    title: "Druckservice",
    text: "Flyer, Broschüren, Karten und Geschäftsdrucksorten in hochwertiger Produktion.",
    href: "/druckservice"
  },
  {
    icon: Layers3,
    title: "Werbetechnik",
    text: "Banner, Schilder, Roll-ups und Fahrzeugbeschriftung für starke Sichtbarkeit.",
    href: "/werbetechnik"
  },
  {
    icon: Sparkles,
    title: "Werbeagentur",
    text: "Logo, Corporate Design und Kampagnenmaterial für einen klaren Markenauftritt.",
    href: "/werbeagentur"
  }
];

function ZoomPanel({
  title,
  subtitle,
  image,
  href
}: {
  title: string;
  subtitle: string;
  image: string;
  href: string;
}) {
  return (
    <article className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-border shadow-premium">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,.7),rgba(2,6,23,.32)_44%,rgba(2,6,23,.7))]" />
      <div className="absolute inset-0 flex items-end p-8 md:p-12">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.14em] text-white/80">{subtitle}</p>
          <h3 className="mt-2 text-4xl font-black text-white md:text-6xl">{title}</h3>
          <Button asChild variant="outline" className="mt-5 border-white/45 bg-white/12 text-white backdrop-blur hover:bg-white/20 hover:text-white">
            <Link href={href}>Mehr erfahren</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ScrollZoomHero() {
  return (
    <section className="container-page py-16 md:py-24">
      <div className="mb-8">
        <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Dienstleistungen
        </Badge>
        <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl">Was Wir Für Sie Umsetzen</h2>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">Klarer Fokus auf Verkauf, Sichtbarkeit und professionelle Markenwirkung.</p>
      </div>

      <div className="mb-14 grid gap-6 sm:grid-cols-3">
        {services.map(({ icon: Icon, title, text, href }) => (
          <Card key={title} className="group border border-border bg-card shadow-[0_14px_36px_rgba(15,23,42,.07)] transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-premium">
            <CardContent className="p-8">
              <Link href={href} className="block">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Icon className="h-6 w-6" />
                </div>
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

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Leistungsbereiche</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground md:text-6xl">Vom ersten Eindruck bis zur finalen Produktion</h2>
      </div>
      <div className="grid gap-8">
        {panels.map((panel) => (
          <ZoomPanel
            key={panel.title}
            title={panel.title}
            subtitle={panel.subtitle}
            image={panel.image}
            href={panel.href}
          />
        ))}
      </div>
    </section>
  );
}
