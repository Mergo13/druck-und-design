import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung von druck&design studio gemäß DSGVO und österreichischem Datenschutzrecht."
};

const entries = [
  ["1. Verantwortlicher", "druck&design studio, Mergim Izairi, Roseggerstraße 11, 4600 Wels, Österreich. E-Mail: service@druckdesignstudio.at, Telefon: 07242 63 2 39."],
  ["2. Verarbeitete Daten", "Je nach Nutzung verarbeiten wir Stamm- und Kontaktdaten, Unternehmens- und UID-Daten, Liefer- und Rechnungsadressen, Bestell-, Produkt- und Zahlungsstatusdaten, Kommunikationsinhalte, hochgeladene Druck- und Bilddateien, Freigaben sowie technische Protokolldaten wie IP-Adresse, Zeitpunkt, Browser und aufgerufene Seiten."],
  ["3. Zwecke und Rechtsgrundlagen", "Die Verarbeitung erfolgt zur Vertragsanbahnung und Vertragserfüllung, zur Erstellung und Produktion von Druck- und Designleistungen, zur Zahlungs- und Versandabwicklung, Rechnungslegung, Kundenbetreuung und Reklamationsbearbeitung (Art. 6 Abs. 1 lit. b DSGVO), zur Erfüllung gesetzlicher Aufbewahrungs- und Nachweispflichten (lit. c), zur Sicherheit, Missbrauchsabwehr und wirtschaftlichen Betriebsführung auf Grundlage berechtigter Interessen (lit. f) sowie, wo erforderlich, aufgrund Ihrer Einwilligung (lit. a)."],
  ["4. Kundenkonto und Bestellungen", "Kontodaten werden verwendet, um Anmeldung, Preiszugang, Bestellhistorie, Adressen, Uploads und Rechnungen bereitzustellen. Bestell- und Rechnungsdaten werden entsprechend gesetzlicher Aufbewahrungspflichten gespeichert. Eine Löschung des Kontos berührt zwingend aufzubewahrende Geschäftsunterlagen nicht."],
  ["5. Druckdaten und Uploads", "Hochgeladene Dateien werden zur Prüfung, Produktion, Freigabe, Reklamationsbearbeitung und gegebenenfalls Nachbestellung verarbeitet. Bitte übermitteln Sie keine besonderen Kategorien personenbezogener Daten, sofern diese für den Auftrag nicht erforderlich sind. Produktionsdaten werden gelöscht oder anonymisiert, sobald sie für diese Zwecke und gesetzliche Nachweise nicht mehr benötigt werden."],
  ["6. Zahlungsabwicklung", "Bei Online-Zahlungen werden die für die Zahlung erforderlichen Daten an Stripe als Zahlungsdienstleister übermittelt. Vollständige Karteninformationen werden nicht auf unseren Systemen gespeichert. Es gelten ergänzend die Datenschutzinformationen des Zahlungsdienstleisters."],
  ["7. CRM, Rechnung und Kommunikation", "Kunden-, Bestell- und Rechnungsdaten werden an unser angebundenes CRM- und Rechnungssystem übermittelt, um Kunden, Aufträge, Rechnungsnummern und PDF-Rechnungen zu verwalten. E-Mails werden über den konfigurierten SMTP- oder E-Mail-Dienst versendet. Empfänger erhalten nur die für den jeweiligen Zweck erforderlichen Informationen."],
  ["8. Versand und Produktion", "Für Versandangebote und Zustellung können Name, Anschrift, Paket- und Bestelldaten an Versanddienstleister, insbesondere den jeweils im Checkout ausgewählten Anbieter, übermittelt werden. Externe Produktionspartner erhalten nur jene Daten und Dateien, die zur vereinbarten Herstellung erforderlich sind."],
  ["9. Hosting und Dateispeicher", "Die Website wird auf technischer Infrastruktur betrieben, bei der Server- und Sicherheitsprotokolle anfallen. Produktbilder und Auftragsdateien können in einem externen Objektspeicher gespeichert werden. Mit eingesetzten Auftragsverarbeitern werden die erforderlichen datenschutzrechtlichen Vereinbarungen getroffen."],
  ["10. Reichweitenmessung und Marketing", "Soweit Google Analytics, Meta Pixel oder Microsoft Clarity aktiviert sind, werden diese Dienste nur auf einer rechtlich zulässigen Grundlage eingesetzt. Nicht technisch notwendige Cookies oder vergleichbare Technologien setzen eine erforderliche Einwilligung voraus. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden."],
  ["11. Speicherdauer", "Wir speichern Daten nur so lange, wie dies für den jeweiligen Zweck, zur Vertragserfüllung, für Gewährleistung und Rechtsverteidigung oder aufgrund gesetzlicher Aufbewahrungspflichten erforderlich ist. Danach werden Daten gelöscht oder anonymisiert, sofern keine zulässigen Gründe für eine weitere Speicherung bestehen."],
  ["12. Empfänger und Drittstaaten", "Empfänger können IT-, Hosting-, Speicher-, Zahlungs-, Versand-, Kommunikations-, CRM-, Buchhaltungs- und Produktionsdienstleister sowie Behörden und berufliche Berater sein. Bei Übermittlungen außerhalb des EWR achten wir auf einen Angemessenheitsbeschluss oder geeignete Garantien nach der DSGVO, soweit keine gesetzliche Ausnahme greift."],
  ["13. Ihre Rechte", "Sie haben nach Maßgabe der DSGVO Rechte auf Information, Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Einwilligungen können jederzeit für die Zukunft widerrufen werden. Zur Ausübung genügt eine Nachricht an service@druckdesignstudio.at. Außerdem besteht ein Beschwerderecht bei der Österreichischen Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, dsb@dsb.gv.at."],
  ["14. Sicherheit und Änderungen", "Wir treffen angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer Daten. Diese Erklärung wird angepasst, wenn sich Verarbeitungsvorgänge, Dienstleister oder rechtliche Anforderungen ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar."]
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p className="text-base leading-8">Der sorgfältige Umgang mit Kunden-, Auftrags- und Druckdaten ist für unsere Arbeit wesentlich. Diese Erklärung informiert transparent über die Verarbeitung auf der Website und im Rahmen unserer Leistungen.</p>
      {entries.map(([title, text]) => (
        <section key={title}>
          <h2 className="text-xl font-black text-brand-ink">{title}</h2>
          <p className="mt-3">{text}</p>
        </section>
      ))}
    </LegalPage>
  );
}
