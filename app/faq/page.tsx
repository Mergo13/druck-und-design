import { PageHero } from "@/components/page-hero";

const faqs = [
  ["Welche Druckdaten werden akzeptiert?", "PDF/X-Dateien sind ideal. Zusätzlich unterstützen wir AI, PSD, PNG und TIFF für ausgewählte Workflows."],
  ["Gibt es einen automatischen Datencheck?", "Ja, der Preflight prüft Beschnitt, Auflösung, Farbmodus und Schriften vor Produktionsstart."],
  ["Welche Produkte sind Same Day verfügbar?", "Ausgewählte Flyer, Visitenkarten, Plakate und Roll-ups können bei rechtzeitigem Upload am selben Tag produziert werden."],
  ["Kann ich Designs speichern?", "Ja, Vorlagen, Konfigurationen und Uploads werden im Kundenkonto für Nachbestellungen abgelegt."]
];

export default function FAQPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Antworten rund um Druck, Upload und Lieferung" text="Die wichtigsten Informationen für reibungslose Bestellungen und druckfertige Ergebnisse." />
      <section className="container-page grid gap-4 py-10">
        {faqs.map(([q, a]) => <details className="rounded-lg border p-5 shadow-soft" key={q}><summary className="cursor-pointer font-black">{q}</summary><p className="mt-3 text-muted-foreground">{a}</p></details>)}
      </section>
    </>
  );
}
