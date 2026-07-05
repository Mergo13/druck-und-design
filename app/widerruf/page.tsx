import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Widerruf und Rücktritt",
  description: "Informationen zum gesetzlichen Rücktrittsrecht und zu individuell angefertigten Druckprodukten."
};

export default function WithdrawalPage() {
  return (
    <LegalPage title="Widerruf / Rücktritt">
      <section>
        <h2 className="text-xl font-black text-brand-ink">Rücktrittsrecht für Verbraucher</h2>
        <p className="mt-3">Verbraucherinnen und Verbraucher können von einem im Fernabsatz geschlossenen Vertrag grundsätzlich innerhalb von 14 Tagen ohne Angabe von Gründen zurücktreten. Bei Waren beginnt die Frist in der Regel mit dem Tag, an dem der Verbraucher oder ein benannter Dritter die Ware erhält; bei Dienstleistungen grundsätzlich mit dem Tag des Vertragsabschlusses.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Individuell angefertigte Produkte</h2>
        <p className="mt-3">Kein gesetzliches Rücktrittsrecht besteht insbesondere bei Waren, die nach Kundenspezifikationen angefertigt werden oder eindeutig auf persönliche Bedürfnisse zugeschnitten sind. Dazu zählen regelmäßig individuell bedruckte, zugeschnittene, beschriftete, konfigurierte oder personalisierte Druckprodukte, Folien, Schilder, Textilien und Werbemittel. Gewährleistungsrechte bei mangelhaften Leistungen bleiben unberührt.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Dienstleistungen vor Ablauf der Rücktrittsfrist</h2>
        <p className="mt-3">Soll auf ausdrücklichen Wunsch bereits vor Ablauf der Rücktrittsfrist mit Grafik-, Web-, Programmier-, Montage- oder sonstigen Dienstleistungen begonnen werden, kann bei einem Rücktritt ein angemessener Betrag für die bis dahin erbrachten Leistungen anfallen. Bei vollständiger Leistungserbringung kann das Rücktrittsrecht unter den gesetzlichen Voraussetzungen entfallen.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Ausübung des Rücktritts</h2>
        <p className="mt-3">Zur Ausübung genügt eine eindeutige Erklärung per E-Mail oder Post an druck&design studio, Mergim Izairi, Roseggerstraße 11, 4600 Wels, service@druckdesignstudio.at. Bitte nennen Sie Name, Anschrift, Bestellnummer, betroffene Leistung und das Datum der Bestellung beziehungsweise des Erhalts.</p>
        <div className="mt-5 border border-slate-200 bg-slate-50 p-5 text-sm">
          <strong>Musterformulierung:</strong><br />
          Hiermit trete ich vom Vertrag über folgende Ware/Dienstleistung zurück: …<br />
          Bestellt am / erhalten am: …<br />
          Name und Anschrift: …<br />
          Datum: …
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Rücksendung und Erstattung</h2>
        <p className="mt-3">Im wirksamen Rücktrittsfall sind empfangene Leistungen nach den gesetzlichen Vorgaben zurückzugewähren. Waren sind grundsätzlich binnen 14 Tagen zurückzusenden. Die unmittelbaren Rücksendekosten trägt der Verbraucher, sofern nicht anders vereinbart. Rückzahlungen erfolgen grundsätzlich über dasselbe Zahlungsmittel, das bei der ursprünglichen Transaktion eingesetzt wurde.</p>
      </section>
    </LegalPage>
  );
}
