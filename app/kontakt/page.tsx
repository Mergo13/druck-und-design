import { Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/features/contact/contact-form";

export default function ContactPage() {
  const supportCards: Array<[LucideIcon, string, string, string]> = [
    [Phone, "Telefon", "+43 (0) 7242 63 2 39", "Mo-Do 8:00-18:00, Fr 8:00-14:00 Uhr"],
    [Mail, "E-Mail", "service@dud-print.de", "Antwort meist am selben Werktag"],
    [MessageCircle, "WhatsApp", "Direktchat starten", "Für schnelle Rückfragen"],
    [MapPin, "Showroom", "Print Campus Berlin", "Termin nach Vereinbarung"]
  ];

  return (
    <>
      <PageHero eyebrow="Kontakt" title="Persönliche Beratung für Druckprojekte" text="Unser Support hilft bei Materialauswahl, Druckdaten, Express-Produktion und Rahmenverträgen für Teams." />
      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
        <ContactForm />
        <aside className="grid gap-4">
          {supportCards.map(([Icon, title, value, text]) => (
            <div className="rounded-lg border p-5 shadow-soft" key={title}>
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-black">{title}</h2>
              <p className="mt-1 font-semibold">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
          <div className="grid h-64 place-items-center rounded-lg border bg-slate-100 text-sm font-bold text-muted-foreground">Google Maps Platzhalter</div>
        </aside>
      </section>
    </>
  );
}
