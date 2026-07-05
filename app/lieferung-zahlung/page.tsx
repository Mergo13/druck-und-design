import type { Metadata } from "next";
import { CreditCard, PackageCheck, Store, Truck } from "lucide-react";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Lieferung und Zahlung",
  description: "Zahlungsarten, Produktionsbeginn, Abholung, Versand und Lieferzeiten bei druck&design studio."
};

const cards = [
  [CreditCard, "Zahlung", "Die im Checkout oder Angebot ausgewiesenen Zahlungsarten können insbesondere Online-Zahlung, Überweisung, Vorauszahlung oder eine individuell vereinbarte Zahlung umfassen."],
  [PackageCheck, "Produktionsbeginn", "Die Produktion startet je nach Auftragsart nach Zahlungseingang, vereinbarter Anzahlung oder schriftlicher Auftrags- und Produktionsfreigabe."],
  [Store, "Abholung", "Vereinbarte Abholaufträge können nach Fertigmeldung am angegebenen Standort und innerhalb der mitgeteilten Öffnungs- oder Abholzeiten übernommen werden."],
  [Truck, "Versand", "Versandart, Kosten und voraussichtliche Laufzeit werden im Checkout oder Angebot ausgewiesen. Teillieferungen erfolgen nur, wenn sie zumutbar oder vereinbart sind."]
] as const;

export default function DeliveryPaymentPage() {
  return (
    <LegalPage title="Lieferung & Zahlung">
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map(([Icon, title, text]) => (
          <section key={title} className="border-t-2 border-brand-blue pt-5">
            <Icon className="h-6 w-6 text-brand-coral" />
            <h2 className="mt-3 text-xl font-black text-brand-ink">{title}</h2>
            <p className="mt-2">{text}</p>
          </section>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Fälligkeit</h2>
        <p className="mt-3">Zahlungen sind zum im Checkout, Angebot oder auf der Rechnung angegebenen Termin ohne Abzug fällig. Bei Vorauszahlung beginnt die Bearbeitung grundsätzlich nach verbuchtem Zahlungseingang. Für individuell vereinbarte Firmenkonditionen gilt das bestätigte Zahlungsziel.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Produktions- und Lieferzeiten</h2>
        <p className="mt-3">Angegebene Produktions- und Lieferzeiten sind geschätzte Zeiträume, sofern ein Termin nicht ausdrücklich schriftlich garantiert wurde. Laufzeiten von Versanddienstleistern liegen nach Übergabe grundsätzlich außerhalb unseres unmittelbaren Einflusses.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Verzögerungen durch fehlende Mitwirkung</h2>
        <p className="mt-3">Verzögerungen aufgrund fehlender oder ungeeigneter Daten, unklarer Angaben, verspäteter Druck- oder Produktionsfreigabe, nachträglicher Änderungswünsche oder verspäteter Zahlung liegen nicht in unserem Verantwortungsbereich. Vereinbarte Zeiträume beginnen in diesen Fällen erst, sobald alle Produktionsvoraussetzungen erfüllt sind.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Transportschäden</h2>
        <p className="mt-3">Bitte prüfen Sie Pakete bei Erhalt auf sichtbare Beschädigungen und dokumentieren Sie Auffälligkeiten möglichst sofort mit Fotos. Ihre gesetzlichen Gewährleistungsrechte werden durch diese Bitte nicht eingeschränkt.</p>
      </section>
    </LegalPage>
  );
}
