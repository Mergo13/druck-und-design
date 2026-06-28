import { PageHero } from "@/components/page-hero";

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Über Uns" title="Druckproduktion trifft digitale Produktlogik" text="Wir verbinden europäische Produktionsqualität mit einer Plattform für Konfiguration, Upload, Freigabe und Nachbestellung." />
      <section className="container-page grid gap-6 py-10 md:grid-cols-3">
        {["Qualität", "Tempo", "Beratung"].map((item) => <div className="rounded-lg border p-6 shadow-soft" key={item}><h2 className="text-2xl font-black">{item}</h2><p className="mt-3 text-muted-foreground">Klare Prozesse, hochwertige Materialien und ein Support-Team, das Druck nicht komplizierter macht als nötig.</p></div>)}
      </section>
    </>
  );
}
