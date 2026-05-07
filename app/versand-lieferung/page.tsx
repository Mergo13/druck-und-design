import { PageHero } from "@/components/page-hero";

export default function ShippingPage() {
  return (
    <>
      <PageHero eyebrow="Versand & Lieferung" title="Planbare Lieferung für jede Deadline" text="Standard, Express und Same-Day-Optionen werden je nach Produkt, Upload-Zeitpunkt und Produktionsfenster transparent angezeigt." />
      <section className="container-page grid gap-5 py-10 md:grid-cols-3">
        {["Standardversand", "Expressversand", "Same Day Kurier"].map((item) => <div className="rounded-lg border p-6 shadow-soft" key={item}><h2 className="text-xl font-black">{item}</h2><p className="mt-2 text-sm text-muted-foreground">Lieferzeiten und Kosten werden live im Konfigurator und Checkout berechnet.</p></div>)}
      </section>
    </>
  );
}
