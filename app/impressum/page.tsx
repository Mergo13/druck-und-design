import { LegalPage } from "@/components/legal-page";

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">druck&design studio</h2>
          <p className="mt-2">
            Mergim Izairi<br />
            Roseggerstraße 11<br />
            4600 Wels | Austria
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unternehmensgegenstand</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Drucker und Druckformenherstellung, eingeschränkt auf Drucker beschränkt auf die Herstellung von Kopien mittels automatischer Kopier-Vervielfältigungsgeräte & Werbeagentur
          </p>
        </div>
      </div>

      <div className="mt-10 border-t pt-10">
        <h2 className="text-xl font-bold text-slate-900">Kontaktdaten</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-bold">Telefon</p>
            <p>07242 63 2 39</p>
          </div>
          <div>
            <p className="font-bold">E-Mail</p>
            <p>service@druckdesignstudio.at</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t pt-10 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold text-slate-900">UID-Nr.</p>
          <p>ATU73973239</p>
        </div>
        <div>
          <p className="font-bold text-slate-900">Behörde & Mitgliedschaften</p>
          <p>Bezirkshauptmannschaft Wels</p>
          <p>Mitglied der WKÖ</p>
        </div>
      </div>

      <div className="mt-10 border-t pt-10">
        <h2 className="text-xl font-bold text-slate-900">Streitbeilegung</h2>
        <p className="mt-4 text-sm">
          Verbraucher haben die Möglichkeit, Beschwerden an die Online-Streitbeilegungsplattform der EU zu richten:{" "}
          <a href="http://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
            http://ec.europa.eu/odr
          </a>. Sie können allfällige Beschwerde auch an die oben angegebene E-Mail-Adresse richten.
        </p>
      </div>

      <div className="mt-10 border-t pt-10">
        <h2 className="text-xl font-bold text-slate-900">Bildnachweise</h2>
        <p className="mt-4 text-sm">https://stock.adobe.com</p>
      </div>
    </LegalPage>
  );
}
