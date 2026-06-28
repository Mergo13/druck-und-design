import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Palette,
  Shapes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { MotionReveal } from "@/components/ui/motion-reveal";
import { VisualServiceShowcase } from "@/components/services/visual-service-showcase";

export const metadata: Metadata = {
  title: "Werbeagentur für Unternehmen",
  description:
    "Individuelle Gestaltung, Programmierung, Branding, Logos, Typografie, Webdesign und Kampagnen für Unternehmen aus Wels und ganz Österreich."
};

const services = [
  {
    label: "Identität",
    title: "Marke & Design",
    text: "Logo, Farbe, Typografie und Bildsprache werden zu einem Auftritt, den man sofort wiedererkennt.",
    image: "/uploads/werbeagentur.jpg"
  },
  {
    label: "Digital",
    title: "Web & Entwicklung",
    text: "Websites, Shops und digitale Werkzeuge, die schnell, verständlich und für Ihre Abläufe gebaut sind.",
    image: "/uploads/werbeagentur2.jpg"
  },
  {
    label: "Sichtbarkeit",
    title: "Kampagne & Print",
    text: "Eine Idee, konsequent umgesetzt: auf Social Media, im Web, auf Papier, Fahrzeugen und im Raum.",
    image: "/uploads/werbeagentur3.jpg"
  }
];

export default function AgencyPage() {
  return (
    <>
      <section className="relative min-h-[680px] overflow-hidden bg-slate-950 text-white">
        <Image
          src="/uploads/werbeagentur.jpg"
          alt="Kreative Werbeagentur bei der Entwicklung eines Markenauftritts"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,.94),rgba(2,6,23,.68)_55%,rgba(2,6,23,.22))]" />
        <div className="container-page relative z-10 flex min-h-[680px] items-center py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-white/70">
              <span className="h-0.5 w-12 bg-brand-coral" />
              Werbeagentur aus Wels
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[1.03] md:text-7xl">
              Wir gestalten genau das, was Ihr Unternehmen braucht.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
              Von der ersten Idee bis zum fertigen Markenauftritt: Design, Programmierung, Branding, Logos,
              Typografie, Websites, Kampagnen und Druckprodukte aus einer Hand.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/kontakt">Kostenloses Erstgespräch <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-black/20 text-white hover:bg-black/40">
                <Link href="#leistungen">Leistungen ansehen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <MotionReveal>
            <SectionHeading
              eyebrow="Individuell statt von der Stange"
              title="Eine Agentur, die Ihr Unternehmen wirklich versteht"
              description="Wir hören zu, finden den Kern und bauen daraus eine klare Marke. Ohne Agentursprech und ohne Lösungen von der Stange."
            />
            <div className="mt-8 flex gap-8 border-t border-slate-200 pt-6">
              <div><strong className="block text-3xl font-black text-brand-blue">01</strong><span className="text-sm text-muted-foreground">Ansprechpartner</span></div>
              <div><strong className="block text-3xl font-black text-brand-coral">360°</strong><span className="text-sm text-muted-foreground">Markenauftritt</span></div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.12} className="relative aspect-[4/3] overflow-hidden shadow-premium">
            <Image src="/uploads/werbeagentur2.jpg" alt="Besprechung von Design und Markenstrategie" fill className="object-cover" />
          </MotionReveal>
        </div>
      </section>

      <section id="leistungen" className="py-20">
        <MotionReveal className="container-page mb-10">
          <SectionHeading
            eyebrow="Unsere Leistungen"
            title="Eine Idee. Alle Berührungspunkte."
            description="Wählen Sie einen Bereich und entdecken Sie, wie wir Gestaltung und Technik verbinden."
          />
        </MotionReveal>
        <MotionReveal><VisualServiceShowcase items={services} /></MotionReveal>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container-page">
          <SectionHeading
            eyebrow="So arbeiten wir"
            title="Einfach, verständlich und persönlich"
            description="Klarer Prozess, kurze Wege, sichtbarer Fortschritt."
            inverse
          />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Kennenlernen", "Wir sprechen über Ihr Unternehmen, Ihre Kunden und Ihr Ziel."],
              ["02", "Konzept", "Sie erhalten eine klare Richtung, Leistungen, Zeitplan und Kosten."],
              ["03", "Gestaltung", "Wir entwickeln Entwürfe und verbessern sie gemeinsam mit Ihnen."],
              ["04", "Umsetzung", "Wir programmieren, produzieren und liefern alles einsatzbereit."]
            ].map(([number, title, text]) => (
              <div className="border-t border-white/25 pt-5" key={number}>
                <p className="text-sm font-black text-brand-cyan">{number}</p>
                <h3 className="mt-3 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <Card className="border bg-card shadow-premium">
          <CardContent className="grid gap-8 p-8 md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Palette className="h-4 w-4" />
                <Braces className="h-4 w-4" />
                Kreativität und Technik aus einer Hand
              </div>
              <h2 className="mt-4 max-w-3xl text-4xl font-black">Was braucht Ihr Unternehmen als Nächstes?</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Erzählen Sie uns kurz von Ihrem Vorhaben. Wir empfehlen Ihnen die passende Lösung – verständlich,
                realistisch und auf Ihr Unternehmen zugeschnitten.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/kontakt">Projekt besprechen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
