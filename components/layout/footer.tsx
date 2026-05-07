import Link from "next/link";

const cols = [
  ["Shop", "Flyer drucken", "Visitenkarten", "Broschüren", "Textildruck", "Aufkleber"],
  ["Service", "Druckdatencheck", "Express Produktion", "Reorder System", "Versand & Lieferung", "FAQ"],
  ["Unternehmen", "Über Uns", "Kontakt", "News", "Karriere", "Nachhaltigkeit"],
  ["Rechtliches", "Impressum", "Datenschutz", "AGB", "Widerruf", "Zahlarten"]
];

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-slate-950 text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-2 text-xl font-black"><span className="grid h-9 w-9 place-items-center rounded-md bg-white text-slate-950">D</span>DUD Studio Print</div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">Premium Online-Druckerei für Unternehmen, Agenturen und Teams mit smarter Konfiguration, Datenprüfung und zuverlässiger Produktion in Europa.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map((col) => (
            <div key={col[0]}>
              <h3 className="font-bold">{col[0]}</h3>
              <div className="mt-4 grid gap-2">
                {col.slice(1).map((item) => <Link className="text-sm text-white/65 hover:text-white" href={`/${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>{item}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
