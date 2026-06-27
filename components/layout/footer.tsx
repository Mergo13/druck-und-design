import Image from "next/image";
import Link from "next/link";

const cols: Array<Array<{ label: string; href: string }>> = [
  [
    { label: "Leistungen", href: "/leistungen" },
    { label: "Druckservice", href: "/druckservice" },
    { label: "Werbeagentur", href: "/werbeagentur" },
    { label: "Werbetechnik", href: "/werbetechnik" }
  ],
  [
    { label: "Service", href: "/faq" },
    { label: "Druckdaten", href: "/faq" },
    { label: "Versand", href: "/versand-lieferung" },
    { label: "FAQ", href: "/faq" }
  ],
  [
    { label: "Studio", href: "/ueber-uns" },
    { label: "Über Uns", href: "/ueber-uns" },
    { label: "Kontakt", href: "/kontakt" }
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
    <footer className="mt-20 border-t border-white/70 bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] text-slate-800">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center">
            <Image src="/brand/logo-dud.png" alt="druck&design studio" width={320} height={65} className="h-9 w-auto object-contain md:h-10" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">Ihr Partner für Druckproduktion, Werbetechnik und Design. Digital, präzise und zuverlässig aus Wels.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online Shop aktiv
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map((col) => (
            <div key={col[0].label} className="motion-elevate rounded-lg p-1">
              <h3 className="font-bold text-slate-900">{col[0].label}</h3>
              <div className="mt-4 grid gap-2">
                {col.slice(1).map((item) => <Link className="text-sm text-slate-600 transition hover:translate-x-0.5 hover:text-brand-blue" href={item.href} key={`${item.label}-${item.href}`}>{item.label}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
