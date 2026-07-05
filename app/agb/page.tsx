import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "AGB von druck&design studio für Druck, Gestaltung, Werbetechnik, Webdesign und Online-Bestellungen."
};

const sections = [
  {
    title: "1. Geltungsbereich und Vertragspartner",
    text: "Diese Allgemeinen Geschäftsbedingungen gelten für Verträge mit druck&design studio, Mergim Izairi, Roseggerstraße 11, 4600 Wels, über Druck- und Kopierleistungen, Grafik- und Webdesign, Programmierung, Werbetechnik, Folierungen, Schilder, Textilien, Werbemittel sowie den Verkauf von Produkten über den Onlineshop. Abweichende Bedingungen gelten nur, wenn sie ausdrücklich schriftlich vereinbart wurden. Zwingende Rechte von Verbraucherinnen und Verbrauchern bleiben unberührt."
  },
  {
    title: "2. Angebot, Vertragsschluss und Leistungsumfang",
    text: "Angebote sind, sofern nicht ausdrücklich anders angegeben, freibleibend. Ein Vertrag kommt durch schriftliche Auftragsbestätigung, Annahme eines Angebots, Beginn der Ausführung oder Versand der Ware zustande. Maßgeblich sind die vereinbarte Leistungsbeschreibung, freigegebene Entwürfe und die Bestellzusammenfassung. Nachträgliche Änderungen können Mehrkosten und neue Termine verursachen."
  },
  {
    title: "3. Preise und Zahlungsbedingungen",
    text: "Es gelten die bei Bestellung oder im Angebot ausgewiesenen Preise. Ob Umsatzsteuer, Versand, Montage und sonstige Nebenkosten enthalten sind, wird im jeweiligen Angebot oder Checkout ausgewiesen. Zahlungen sind zum angegebenen Termin ohne Abzug fällig. Je nach Auftrag beginnt die Produktion erst nach vollständigem Zahlungseingang, vereinbarter Anzahlung oder schriftlicher Auftrags- und Produktionsfreigabe."
  },
  {
    title: "4. Zahlungsverzug",
    text: "Bei Zahlungsverzug gelten die gesetzlichen Verzugszinsen. Darüber hinaus können angemessene, tatsächlich erforderliche Mahn-, Inkasso- und Betreibungskosten verlangt werden, soweit sie in einem angemessenen Verhältnis zur offenen Forderung stehen und gesetzlich zulässig sind. Die Geltendmachung eines weitergehenden nachgewiesenen Schadens bleibt vorbehalten."
  },
  {
    title: "5. Eigentumsvorbehalt",
    text: "Gelieferte Waren bleiben bis zur vollständigen Bezahlung sämtlicher Forderungen aus dem jeweiligen Auftrag im Eigentum von druck&design studio. Eine Verarbeitung, Weiterveräußerung oder Belastung vor vollständiger Bezahlung ist nur im ordentlichen Geschäftsbetrieb und unter Wahrung unserer Rechte zulässig."
  },
  {
    title: "6. Druckdaten und Mitwirkung des Kunden",
    text: "Der Kunde stellt rechtzeitig vollständige, technisch geeignete und rechtlich zulässige Inhalte bereit. Dazu gehören insbesondere Druckdaten, Maße, Texte, Logos, Bilder, Schriften, Farbwerte und Zugangsdaten. Sofern kein gesonderter Datencheck vereinbart wurde, prüfen wir Daten nur auf offensichtliche technische Verwendbarkeit, nicht jedoch auf Rechtschreibung, Inhalt, Vollständigkeit, Markenrechte oder gestalterische Richtigkeit. Hinweise auf unserer Seite Druckdaten-Hinweise sind Bestandteil der Auftragsabwicklung."
  },
  {
    title: "7. Druck- und Produktionsfreigabe",
    text: "Mit der Freigabe bestätigt der Kunde, Layout, Texte, Maße, Mengen, Farben, Bilder, Logos, Kontaktdaten und sonstige Inhalte geprüft zu haben. Nach der Freigabe beginnt die Produktion; Änderungen sind dann nur möglich, soweit der Produktionsstand dies zulässt, und können Mehrkosten auslösen. Fehler in ausdrücklich freigegebenen Daten fallen in die Verantwortung des Kunden, soweit wir den Fehler nicht vorsätzlich oder grob fahrlässig verursacht haben."
  },
  {
    title: "8. Produktionsbedingte Toleranzen",
    text: "Geringfügige Farb-, Material-, Schnitt-, Passer-, Format- und Maßabweichungen sowie Unterschiede zwischen Bildschirmdarstellung, Proof, Nachproduktion und Endprodukt können technisch bedingt sein. Branchenübliche und für den Verwendungszweck zumutbare Toleranzen stellen keinen Mangel dar. Bei Folien, Textilien und Natur- oder Chargenmaterialien können Untergrund, Struktur und Materialcharge das Ergebnis beeinflussen."
  },
  {
    title: "9. Lieferung, Gefahr und Termine",
    text: "Liefer- und Produktionszeiten sind grundsätzlich geschätzte Zeiträume, sofern ein Termin nicht ausdrücklich schriftlich als garantiert vereinbart wurde. Fristen verlängern sich angemessen bei fehlenden oder fehlerhaften Daten, verspäteter Freigabe, Zahlungsverzug, Änderungswünschen, höherer Gewalt oder nicht von uns zu vertretenden Lieferengpässen. Bei Unternehmergeschäften geht die Gefahr nach den gesetzlichen Regeln, insbesondere mit Übergabe an den Transportdienstleister, über."
  },
  {
    title: "10. Reklamationen und Gewährleistung",
    text: "Offensichtliche Mängel sollen unverzüglich nach Erhalt mit Bestellnummer, Beschreibung und aussagekräftigen Fotos gemeldet werden. Unternehmer haben die Ware nach den gesetzlichen unternehmensrechtlichen Bestimmungen zu untersuchen und Mängel rechtzeitig anzuzeigen. Vor Rücksendung oder Entsorgung ist uns Gelegenheit zur Prüfung zu geben. Bei berechtigten Mängeln leisten wir nach den gesetzlichen Bestimmungen Verbesserung, Austausch, Preisminderung oder, soweit vorgesehen, Vertragsaufhebung."
  },
  {
    title: "11. Sonderanfertigungen",
    text: "Individuell bedruckte, zugeschnittene, konfigurierte oder nach Kundenspezifikation hergestellte Produkte können regelmäßig nicht anderweitig verwendet werden. Für Verbraucher kann daher nach Maßgabe des § 18 FAGG kein Rücktrittsrecht bestehen. Gesetzliche Gewährleistungsrechte bei Mängeln bleiben bestehen."
  },
  {
    title: "12. Grafikdesign, Webdesign und Nutzungsrechte",
    text: "Entwürfe, Reinzeichnungen, Quellcodes, Layoutdateien und Konzepte bleiben bis zur vollständigen Bezahlung geschützt. Der Kunde erhält die im Angebot vereinbarten Nutzungsrechte für den vereinbarten Zweck, Umfang, Zeitraum und Medienbereich. Offene Arbeitsdateien, editierbare Quelldateien, Schriften, Plugins, Stockmedien oder übertragbare Exklusivrechte sind nur geschuldet, wenn dies ausdrücklich vereinbart wurde. Gesetzlich zwingende Rechte bleiben unberührt."
  },
  {
    title: "13. Rechte Dritter",
    text: "Der Kunde sichert zu, dass bereitgestellte Logos, Bilder, Texte, Schriften, Marken, Designs und sonstige Inhalte verwendet werden dürfen und keine Rechte Dritter verletzen. Bei nachvollziehbaren Ansprüchen Dritter hat der Kunde an der Klärung mitzuwirken und uns bei von ihm zu vertretenden Rechtsverletzungen schad- und klaglos zu halten, soweit dies gesetzlich zulässig ist."
  },
  {
    title: "14. Montage, Folierung und Werbetechnik",
    text: "Der Kunde informiert uns vorab über Untergrund, Beschaffenheit, Vorschäden, Leitungen, Genehmigungen und örtliche Besonderheiten. Montageflächen müssen zugänglich, tragfähig, gereinigt und geeignet sein. Für Schäden aufgrund verdeckter Mängel, ungeeigneter oder bereits geschädigter Untergründe haften wir nur bei eigenem Verschulden. Demontage, Gerüst, Hebebühne, Genehmigungen und Stromanschlüsse sind nur enthalten, wenn sie vereinbart wurden."
  },
  {
    title: "15. Haftung",
    text: "Wir haften nach den gesetzlichen Bestimmungen für Personenschäden sowie für Schäden, die vorsätzlich oder grob fahrlässig verursacht wurden. Bei leichter Fahrlässigkeit ist die Haftung, soweit gesetzlich zulässig und keine zwingenden Verbraucherrechte entgegenstehen, auf vorhersehbare Schäden aus der Verletzung wesentlicher Vertragspflichten beschränkt. Eine Haftung für vom Kunden freigegebene Inhalte, Datenverluste ohne angemessene Kundensicherung oder mittelbare Schäden ist im gesetzlich zulässigen Umfang ausgeschlossen."
  },
  {
    title: "16. Datenverarbeitung und Aufbewahrung",
    text: "Personenbezogene Daten und Auftragsdaten werden zur Vertragsanbahnung, Produktion, Lieferung, Zahlung, Rechnungslegung, Kundenbetreuung und Erfüllung gesetzlicher Pflichten verarbeitet. Produktions- und Druckdaten können für Nachbestellungen oder Reklamationen angemessen gespeichert werden. Einzelheiten enthält die Datenschutzerklärung."
  },
  {
    title: "17. Anwendbares Recht",
    text: "Es gilt österreichisches Recht unter Ausschluss seiner Verweisungsnormen und des UN-Kaufrechts, soweit dem keine zwingenden Verbraucherschutzbestimmungen entgegenstehen. Für Unternehmer wird, soweit zulässig, die Zuständigkeit des sachlich zuständigen Gerichts am Sitz von druck&design studio vereinbart."
  }
];

export default function TermsPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <p className="text-base leading-8">
        Diese Bedingungen schaffen einen klaren Rahmen für eine verlässliche Zusammenarbeit. Ergänzend gelten unsere{" "}
        <Link href="/druckdaten-hinweise" className="font-bold text-brand-blue hover:underline">Druckdaten-Hinweise</Link>, die{" "}
        <Link href="/lieferung-zahlung" className="font-bold text-brand-blue hover:underline">Liefer- und Zahlungsbedingungen</Link> sowie gesetzlich zwingende Vorschriften.
      </p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-black text-brand-ink">{section.title}</h2>
          <p className="mt-3">{section.text}</p>
        </section>
      ))}
      <p className="border-l-4 border-brand-blue bg-brand-mist px-5 py-4 text-sm">
        Hinweis: Diese Website-Fassung dient der transparenten Vertragsinformation und ersetzt keine individuelle Rechtsberatung für besondere Einzelfälle.
      </p>
    </LegalPage>
  );
}
