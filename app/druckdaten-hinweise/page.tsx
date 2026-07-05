import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Druckdaten-Hinweise",
  description: "Technische Anforderungen für druckfähige PDF-, AI-, EPS-, SVG-, PNG-, JPG- und TIFF-Dateien."
};

const requirements = [
  ["Dateiformate", "Bevorzugt PDF oder PDF/X. Je nach Produkt akzeptieren wir auch AI, EPS, SVG, PNG, JPG und TIFF. Offene Dateien können eine gesonderte Prüfung oder Aufbereitung erfordern."],
  ["Farbraum", "Für Druckprodukte empfehlen wir CMYK mit einem zum Material und Druckverfahren passenden Farbprofil. RGB-Dateien werden bei Bedarf konvertiert; dabei können sichtbare Farbverschiebungen entstehen."],
  ["Auflösung", "Für Bilder und Pixelgrafiken empfehlen wir bei Endformat grundsätzlich mindestens 300 dpi. Bei Großformaten kann abhängig vom Betrachtungsabstand eine geringere Auflösung ausreichend sein."],
  ["Beschnittzugabe", "Druckdaten müssen die beim Produkt angegebene Beschnittzugabe enthalten, üblicherweise 2 bis 3 mm umlaufend. Hintergrundbilder und Farbflächen sind bis in den Beschnitt zu führen."],
  ["Sicherheitsabstand", "Wichtige Texte, Logos und Gestaltungselemente sollen ausreichend Abstand zur Schnittkante und zu Falz-, Stanz- oder Nahtlinien haben. Maßgeblich ist die jeweilige Produktspezifikation."],
  ["Schriften", "Schriften müssen vollständig eingebettet oder in Pfade beziehungsweise Konturen umgewandelt sein. Für nicht eingebettete oder nicht mitgelieferte Schriften kann keine identische Ausgabe garantiert werden."],
  ["Schwarzaufbau", "Kleine schwarze Texte und feine Linien sollten, soweit für das Druckverfahren geeignet, als reines Schwarz angelegt werden. Tiefschwarz für große Flächen ist nach der jeweiligen Produktionsvorgabe aufzubauen."],
  ["Transparenzen und Effekte", "Transparenzen, Überdrucken, Ebenen, Verläufe und Sonderfarben sind vor Ausgabe sorgfältig zu kontrollieren. PDF/X reduziert typische Produktionsrisiken."],
  ["Bildschirmdarstellung", "Farben auf Monitoren, Smartphones und nicht kalibrierten Ausgabegeräten sind nicht verbindlich. Material, Oberfläche, Licht, Druckverfahren und Charge beeinflussen den Farbeindruck."],
  ["Kontrolle und Freigabe", "Bitte kontrollieren Sie Endformat, Seitenfolge, Ausrichtung, Texte, Telefonnummern, URLs, QR-Codes, Bilder, Logos, Farben und Stückzahl. Nach der Produktionsfreigabe trägt der Kunde die Verantwortung für Fehler in den freigegebenen Daten, soweit keine zwingenden gesetzlichen Gründe entgegenstehen."]
];

export default function PrintDataPage() {
  return (
    <LegalPage title="Druckdaten-Hinweise">
      <p className="text-base leading-8">Sauber angelegte Daten vermeiden Rückfragen und sorgen für ein verlässliches Produktionsergebnis. Produktspezifische Vorgaben im Konfigurator oder Angebot gehen diesen allgemeinen Empfehlungen vor.</p>
      {requirements.map(([title, text]) => (
        <section key={title} className="grid gap-2 md:grid-cols-[180px_1fr]">
          <h2 className="font-black text-brand-ink">{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <p className="border-l-4 border-brand-coral bg-[#fff5f2] px-5 py-4 text-sm">Unsicher bei Ihren Daten? Buchen Sie vor der Produktion einen erweiterten Druckdatencheck oder senden Sie uns die Datei zur technischen Beurteilung.</p>
    </LegalPage>
  );
}
