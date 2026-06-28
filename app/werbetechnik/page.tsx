import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/ui/motion-reveal";
import { VisualServiceShowcase } from "@/components/services/visual-service-showcase";
import { ProjectShowroom } from "@/components/services/project-showroom";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Map,
  Palette,
  ShieldCheck,
  Store,
  Utensils,
  Wrench
} from "lucide-react";

export const metadata = {
  title: "Werbetechnik Wels | Schilder, Folien, Banner & Fahrzeugbeschriftung | druck&design",
  description:
    "Werbetechnik in Wels: Fahrzeugbeschriftung, Schaufensterfolien, Schilder, Banner, Roll-Ups, Textildruck, Aufkleber, Großformatdruck und Montage für Unternehmen, Vereine und Gastronomie."
};

const visualServices = [
  {
    label: "Mobil",
    title: "Fahrzeugwerbung",
    text: "Vom einzelnen Firmenwagen bis zur Flotte: präzise gestaltet, produziert und montiert.",
    image: "/uploads/werbetechnik.jpg"
  },
  {
    label: "Vor Ort",
    title: "Fenster & Schilder",
    text: "Schaufenster, Leitsysteme und Fassaden werden zu klaren, hochwertigen Markenflächen.",
    image: "/uploads/werbetechnik2.jpg"
  },
  {
    label: "Groß gedacht",
    title: "Banner & Displays",
    text: "Werbung mit Fernwirkung für Messe, Baustelle, Veranstaltung und Verkaufsfläche.",
    image: "/uploads/werbetechnik3.jpg"
  }
];

const showroomProjects = [
  {
    category: "Fahrzeugbeschriftung",
    title: "Markenauftritt in Bewegung",
    description: "Konzeption, Folienauswahl und präzise Montage für einen professionellen Auftritt auf jeder Fahrt.",
    image: "/uploads/werbetechnik.jpg"
  },
  {
    category: "Schaufenster & Fassade",
    title: "Sichtbarkeit am richtigen Ort",
    description: "Großflächige Gestaltung, die Orientierung schafft, Aufmerksamkeit gewinnt und zur Marke passt.",
    image: "/uploads/werbetechnik2.jpg"
  },
  {
    category: "Außenwerbung",
    title: "Klare Botschaft. Starke Wirkung.",
    description: "Langlebige Materialien und eine Gestaltung, die auch aus der Entfernung sofort verstanden wird.",
    image: "/uploads/werbetechnik3.jpg"
  }
];

const industries = [
  { icon: Utensils, title: "Gastronomie", text: "Individuelle Speisekarten, Fenstergrafiken, Tafelsysteme, Banner und verkaufsstarke Aktionswerbung." },
  { icon: Store, title: "Handel & Shops", text: "Einladende Schaufenstergestaltung, POS-Marketing, professionelle Beschilderung und verkaufsfördernde Folierungen." },
  { icon: Wrench, title: "Handwerk & Bau", text: "Markante Fahrzeugbeschriftung, robuste Baustellenschilder, Arbeitskleidung und langlebige Firmenwerbung." },
  { icon: ShieldCheck, title: "Praxen & Büros", text: "Repräsentative Praxisschilder, diskreter Sichtschutz, Leitsysteme und exklusive Glasdekorfolien für ein professionelles Ambiente." }
];

const processSteps = [
  { title: "1. Beratung & Aufmaß", text: "Wir klären Standort, Material, Größe, Einsatzbereich und technische Anforderungen." },
  { title: "2. Design & Freigabe", text: "Sie erhalten einen professionellen Entwurf passend zu Logo, Fläche und Werbeziel." },
  { title: "3. Produktion", text: "Folien, Schilder, Drucke oder Textilien werden druckfertig und sauber produziert." },
  { title: "4. Montage", text: "Auf Wunsch übernehmen wir die professionelle Montage direkt vor Ort." }
];

const trustItems = [
  "Professionelle Materialberatung für Innen- und Außenbereich",
  "Design, Druck, Folie und Montage aus einer Hand",
  "Saubere Druckdatenprüfung vor der Produktion",
  "Lösungen für kleine Auflagen und größere Projekte",
  "Ideal für lokale Unternehmen, Vereine und Gastronomie",
  "Persönlicher Ansprechpartner von Anfrage bis Fertigstellung"
];

const faqs = [
  {
    question: "Macht ihr auch Montage vor Ort?",
    answer: "Ja. Je nach Projekt übernehmen wir Aufmaß, Vorbereitung und Montage, zum Beispiel bei Schaufensterfolien, Schildern oder Fahrzeugbeschriftungen."
  },
  {
    question: "Kann ich nur eine einzelne Folie oder ein einzelnes Schild bestellen?",
    answer: "Ja. Kleine Mengen sind möglich. Wir beraten Sie, welches Material und welche Ausführung für Ihren Einsatzzweck sinnvoll sind."
  },
  {
    question: "Erstellt ihr auch das Design?",
    answer: "Ja. Wir können das Design komplett neu erstellen oder bestehende Logos und Daten professionell für Werbetechnik und Druck aufbereiten."
  }
];

export default function WerbetechnikPage() {
  return (
    <>
      <section className="relative min-h-[680px] overflow-hidden bg-slate-950 text-white">
        <Image src="/uploads/werbetechnik.jpg" alt="Professionelle Fahrzeugbeschriftung und Werbetechnik" fill priority className="object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
        <div className="container-page relative z-10 flex min-h-[680px] items-center py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-white/70">
              <span className="h-0.5 w-12 bg-brand-coral" />
              Werbetechnik aus Wels
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] md:text-7xl">Ihre Marke gehört nach draußen.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-white/80">Fahrzeuge, Fenster, Schilder und Displays, die nicht nur auffallen, sondern professionell wirken.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/kontakt">Projekt anfragen <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-black/20 text-white hover:bg-black/40"><Link href="#bereiche">Arbeiten ansehen</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section id="bereiche" className="py-20">
        <MotionReveal className="container-page mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Was wir sichtbar machen</span>
          <h2 className="mt-3 max-w-3xl text-4xl font-black text-brand-ink md:text-5xl">Drei Flächen. Unzählige Möglichkeiten.</h2>
        </MotionReveal>
        <MotionReveal><VisualServiceShowcase items={visualServices} /></MotionReveal>
      </section>

      <section className="container-page py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Branchenlösungen</span>
          <h2 className="mt-3 text-4xl font-black text-brand-ink">Passend für Ihr Unternehmen</h2>
          <p className="mt-4 text-muted-foreground">Wir denken Werbetechnik nicht nur als Produkt, sondern als sichtbaren Teil Ihres Verkaufsauftritts.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {industries.map((industry) => (
            <div key={industry.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <industry.icon className="mb-5 h-8 w-8 text-brand-blue" />
              <h3 className="text-lg font-black text-brand-ink">{industry.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{industry.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ProjectShowroom projects={showroomProjects} />

      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Unser Ablauf</span>
            <h2 className="mt-3 text-4xl font-black text-brand-ink">Von der Fläche bis zur fertigen Montage</h2>
            <p className="mt-4 text-muted-foreground">Damit Ihr Ergebnis sauber aussieht und lange hält, achten wir auf Material, Untergrund, Druckdaten und Einsatzbereich.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <BadgeCheck className="mb-5 h-8 w-8 text-brand-blue" />
                <h3 className="text-lg font-black text-brand-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">FAQ</span>
            <h2 className="mt-3 text-4xl font-black text-brand-ink">Häufige Fragen zur Werbetechnik</h2>
            <p className="mt-4 text-muted-foreground">Die wichtigsten Antworten vor Ihrer Anfrage.</p>
          </div>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-black text-brand-ink">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white md:p-16">
          {/* Futuristic background elements */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-[100px]" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-brand-cyan/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3 text-brand-cyan">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/10">
                  <Palette className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Unverbindliche Anfrage</span>
              </div>
              <h2 className="text-3xl font-black md:text-5xl lg:leading-[1.1]">Sie brauchen Schilder, Folien, Banner oder Fahrzeugwerbung?</h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">Senden Sie uns Foto, Maße oder eine kurze Idee. Wir beraten Sie zu Material, Design, Produktion und Montage.</p>
            </div>
            <div className="flex items-center">
              <Button asChild size="lg" className="h-14 px-10 text-base shadow-2xl">
                <Link href="/kontakt">Jetzt Werbetechnik anfragen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
