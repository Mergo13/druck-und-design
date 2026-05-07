import { FileText, Heart, MapPin, Package, Settings, Upload, Wand2, type LucideIcon } from "lucide-react";

const items: Array<[LucideIcon, string, string]> = [
  [Package, "Bestellungen", "Status, Tracking und Nachbestellung"],
  [FileText, "Rechnungen", "Belege und Zahlungsstatus"],
  [Upload, "Uploads", "Druckdaten und Preflight-Protokolle"],
  [Wand2, "Gespeicherte Designs", "Vorlagen, Entwürfe und Mockups"],
  [MapPin, "Adressen", "Liefer- und Rechnungsadressen"],
  [Heart, "Wunschliste", "Gemerkte Produkte"],
  [Settings, "Kontoeinstellungen", "Team, Sicherheit und Benachrichtigungen"]
];

export default function AccountPage() {
  return (
    <section className="container-page py-10">
      <p className="font-bold text-primary">Kundenkonto</p>
      <h1 className="mt-2 text-4xl font-black">Dashboard</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([Icon, title, text]) => (
          <div className="rounded-lg border p-6 shadow-soft" key={title}>
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-5 text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
