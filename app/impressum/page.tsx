import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontaktdaten von druck&design studio in Wels."
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-black text-brand-ink">Medieninhaber und Diensteanbieter</h2>
          <p className="mt-3">
            <strong>druck&design studio</strong><br />
            Inhaber: Mergim Izairi<br />
            Roseggerstraße 11<br />
            4600 Wels, Österreich
          </p>
        </div>
        <div>
          <h2 className="text-xl font-black text-brand-ink">Kontakt</h2>
          <p className="mt-3">
            Telefon: <a className="text-brand-blue hover:underline" href="tel:+43724263239">07242 63 2 39</a><br />
            E-Mail: <a className="text-brand-blue hover:underline" href="mailto:service@druckdesignstudio.at">service@druckdesignstudio.at</a><br />
            Website: druck-und-design.at
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Unternehmens- und Gewerbeangaben</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <p><strong>UID-Nummer:</strong><br />ATU73973239</p>
          <p><strong>Mitgliedschaft:</strong><br />Wirtschaftskammer Österreich</p>
          <p><strong>Zuständige Behörde:</strong><br />Magistrat der Stadt Wels</p>
          <p><strong>Anwendbare Vorschriften:</strong><br />Gewerbeordnung, abrufbar über ris.bka.gv.at</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Unternehmensgegenstand</h2>
        <p className="mt-3">Druckerei und Copyservice, Werbeagentur, Grafik- und Webdesign, Programmierung, Werbetechnik, Herstellung und Vertrieb von Druckprodukten, Aufklebern, Roll-ups, Folierungen, Schildern, Textilien und Werbematerialien sowie Onlinehandel.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Grundlegende Richtung</h2>
        <p className="mt-3">Information über Produkte und Dienstleistungen von druck&design studio sowie Bereitstellung eines Onlineangebots für Druck, Gestaltung, Werbung und digitale Leistungen.</p>
      </section>

      <section>
        <h2 className="text-xl font-black text-brand-ink">Haftung und Urheberrecht</h2>
        <p className="mt-3">Die Inhalte dieser Website werden sorgfältig gepflegt. Für externe Links sind deren Betreiber verantwortlich. Inhalte, Gestaltung, Bilder und Marken sind urheber- oder kennzeichenrechtlich geschützt; eine Verwendung außerhalb der gesetzlichen Grenzen bedarf der Zustimmung des jeweiligen Rechteinhabers.</p>
      </section>
    </LegalPage>
  );
}
