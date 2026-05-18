import Link from "next/link";

const cols: Array<Array<{ label: string; href: string }>> = [
  [
    { label: "Produkte", href: "/shop" },
    { label: "Druckprodukte", href: "/shop" },
    { label: "Werbetechnik", href: "/werbetechnik" },
    { label: "Textildruck", href: "/textildruck" },
    { label: "Aufkleber", href: "/aufkleber" }
  ],
  [
    { label: "Service", href: "/faq" },
    { label: "Druckdaten", href: "/faq" },
    { label: "Express", href: "/shop?kategorie=same-day" },
    { label: "Versand", href: "/versand-lieferung" },
    { label: "FAQ", href: "/faq" }
  ],
  [
    { label: "Studio", href: "/ueber-uns" },
    { label: "Über Uns", href: "/ueber-uns" },
    { label: "Kontakt", href: "/kontakt" },
    { label: "News", href: "/news" }
  ],
  [
    { label: "Rechtliches", href: "/impressum" },
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "AGB", href: "/agb" }
  ]
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
            <div key={col[0].label}>
              <h3 className="font-bold">{col[0].label}</h3>
              <div className="mt-4 grid gap-2">
                {col.slice(1).map((item) => <Link className="text-sm text-white/65 hover:text-white" href={item.href} key={`${item.label}-${item.href}`}>{item.label}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
