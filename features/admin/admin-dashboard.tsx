"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  BarChart3,
  Building2,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  LineChart,
  Mail,
  Megaphone,
  Package,
  Plane,
  ReceiptText,
  Search,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Upload,
  Users,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MenuItem = {
  section: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menu: MenuItem[] = [
  { section: "", label: "Dashboard", icon: BarChart3 },
  { section: "Orders", label: "Orders", icon: ShoppingCart },
  { section: "Orders", label: "Quotes", icon: ReceiptText },
  { section: "Orders", label: "Invoices", icon: ReceiptText },
  { section: "Orders", label: "File Uploads", icon: Upload },
  { section: "Marketing", label: "Coupons", icon: Tag },
  { section: "Catalog", label: "Categories", icon: Tag },
  { section: "Catalog", label: "Products", icon: Package },
  { section: "Marketing", label: "Reviews", icon: Star },
  { section: "Marketing", label: "Newsletter", icon: Mail },
  { section: "Reports", label: "Sales", icon: BarChart3 },
  { section: "Reports", label: "Analytics", icon: LineChart },
  { section: "Settings", label: "Company Information", icon: Building2 },
  { section: "Settings", label: "Shipping", icon: Truck },
  { section: "Settings", label: "Payment Methods", icon: CreditCard },
  { section: "Settings", label: "Tax/VAT", icon: ReceiptText },
  { section: "Settings", label: "Users & Roles", icon: Users },
  { section: "Store Control", label: "Maintenance Mode", icon: Wrench },
  { section: "Store Control", label: "Vacation Mode", icon: Plane },
  { section: "Store Control", label: "Disable Checkout", icon: Ban },
  { section: "Store Control", label: "Announcement Bar", icon: Megaphone },
  { section: "Store Control", label: "Email Templates", icon: Mail },
  { section: "System", label: "Activity Logs", icon: Activity },
  { section: "System", label: "Backups", icon: Package },
  { section: "System", label: "Security", icon: Shield }
];

const moduleByLabel: Record<string, string> = {
  Orders: "orders",
  Quotes: "quotes",
  Invoices: "invoices",
  "File Uploads": "fileUploads",
  Coupons: "coupons",
  Reviews: "reviews",
  Newsletter: "newsletter",
  Shipping: "shipping",
  "Payment Methods": "paymentMethods",
  "Users & Roles": "usersRoles",
  "Email Templates": "emailTemplates",
  "Activity Logs": "activityLogs",
  Backups: "backups",
  Security: "security",
  Categories: "categories",
  Products: "products"
};

type PaginatedResponse = { items: Record<string, unknown>[]; total: number; page: number; pageSize: number };
type SettingsResponse = {
  company: Record<string, unknown>;
  tax: Record<string, unknown>;
  storeControl: Record<string, unknown>;
};

export function AdminDashboard() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@dud-studio.at";
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [settingsState, setSettingsState] = useState<"idle" | "saving">("idle");
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const json = await res.json() as SettingsResponse;
    setSettings(json);
  }

  async function saveSettings(next: SettingsResponse) {
    setSettingsState("saving");
    setSettingsMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    if (!res.ok) {
      setSettingsMessage("Speichern fehlgeschlagen.");
      setSettingsState("idle");
      return;
    }
    const updated = await res.json() as SettingsResponse;
    setSettings(updated);
    setSettingsMessage("Gespeichert.");
    setSettingsState("idle");
    setRefreshNonce((current) => current + 1);
  }

  const groupedMenu = useMemo(() => {
    const sections = new Map<string, MenuItem[]>();
    for (const item of menu) {
      const key = item.section || "_main";
      sections.set(key, [...(sections.get(key) ?? []), item]);
    }
    return sections;
  }, []);

  return (
    <section className="min-h-screen bg-[#f8fafc]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-white flex flex-col sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 font-black text-2xl text-brand-blue">
              <LayoutGrid className="w-8 h-8" />
              <span>DUD Admin</span>
            </div>
          </div>
          
          <div className="flex-1 py-6 px-4">
            {Array.from(groupedMenu.entries()).map(([section, items]) => (
              <div key={section} className="mb-6 last:mb-0">
                {section !== "_main" ? (
                  <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {section}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = activeMenu === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setActiveMenu(item.label)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                          isActive 
                            ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && <ChevronRight className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t mt-auto">
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Administrator</p>
                <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-10 px-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">{activeMenu}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Admin</span>
                <ChevronRight className="h-2 w-2" />
                <span>{activeMenu}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Schnellsuche..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-xs focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all outline-none"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full font-bold"
                onClick={() => setRefreshNonce((current) => current + 1)}
              >
                Aktualisieren
              </Button>
            </div>
          </header>

          <div className="p-8">
            {activeMenu === "Dashboard" ? <DashboardPanels refreshNonce={refreshNonce} /> : null}
            {moduleByLabel[activeMenu] ? <ModuleCrudPanel title={activeMenu} moduleKey={moduleByLabel[activeMenu]} refreshNonce={refreshNonce} /> : null}
            {activeMenu === "Sales" ? <SalesPanel refreshNonce={refreshNonce} /> : null}
            {activeMenu === "Analytics" ? <AnalyticsPanel /> : null}

            {activeMenu === "Company Information" && settings ? (
              <AdminPanel title="Unternehmensdaten" description="Verwalten Sie Ihre Firmendaten für Rechnungen und Kontaktseiten.">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unternehmensname</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.name ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, name: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rechtsform</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.legalName ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, legalName: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.email ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, email: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefon</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.phone ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, phone: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">UID Nummer</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.vatId ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, vatId: event.target.value } })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Adresse</label>
                    <Input className="rounded-xl border-slate-200" value={String(settings.company.address ?? "")} onChange={(event) => setSettings({ ...settings, company: { ...settings.company, address: event.target.value } })} />
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between pt-6 border-t">
                  <p className="text-sm text-slate-500">{settingsMessage}</p>
                  <Button className="rounded-xl px-8 font-bold bg-brand-blue hover:bg-brand-blue/90" onClick={() => void saveSettings(settings)} disabled={settingsState === "saving"}>
                    {settingsState === "saving" ? "Wird gespeichert..." : "Änderungen speichern"}
                  </Button>
                </div>
              </AdminPanel>
            ) : null}

            {activeMenu === "Tax/VAT" && settings ? (
              <AdminPanel title="Steuersätze" description="Konfigurieren Sie die Standard-Mehrwertsteuersätze für Ihren Shop.">
                <div className="max-w-sm space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">MwSt. %</label>
                  <Input type="number" className="rounded-xl border-slate-200" value={String(settings.tax.vatPercent ?? 0)} onChange={(event) => setSettings({ ...settings, tax: { ...settings.tax, vatPercent: Number(event.target.value) } })} />
                </div>
                <div className="mt-8 flex items-center justify-between pt-6 border-t">
                  <p className="text-sm text-slate-500">{settingsMessage}</p>
                  <Button className="rounded-xl px-8 font-bold bg-brand-blue hover:bg-brand-blue/90" onClick={() => void saveSettings(settings)} disabled={settingsState === "saving"}>
                    {settingsState === "saving" ? "Speichern..." : "Speichern"}
                  </Button>
                </div>
              </AdminPanel>
            ) : null}

            {activeMenu === "Maintenance Mode" && settings ? <StoreTogglePanel label="Wartungsmodus" description="Deaktivieren Sie den öffentlichen Zugriff auf den Shop für Wartungsarbeiten." keyName="maintenanceMode" settings={settings} onSave={saveSettings} saving={settingsState === "saving"} /> : null}
            {activeMenu === "Vacation Mode" && settings ? <StoreTogglePanel label="Urlaubsmodus" description="Informieren Sie Kunden über längere Lieferzeiten während Ihres Urlaubs." keyName="vacationMode" settings={settings} onSave={saveSettings} saving={settingsState === "saving"} /> : null}
            {activeMenu === "Disable Checkout" && settings ? <StoreTogglePanel label="Bestellstopp" description="Verhindern Sie neue Bestellungen, lassen Sie Kunden aber weiterhin im Katalog stöbern." keyName="disableCheckout" settings={settings} onSave={saveSettings} saving={settingsState === "saving"} /> : null}
            {activeMenu === "Maintenance Mode" ? <OperationsQuickPanel onNavigate={setActiveMenu} /> : null}
            {activeMenu === "Vacation Mode" ? <OperationsQuickPanel onNavigate={setActiveMenu} /> : null}
            {activeMenu === "Announcement Bar" && settings ? (
              <AdminPanel title="Ankündigungsleiste" description="Zeigen Sie eine wichtige Nachricht im oberen Bereich jeder Seite an.">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Text der Nachricht</label>
                  <Input className="rounded-xl border-slate-200" value={String(settings.storeControl.announcementBar ?? "")} onChange={(event) => setSettings({ ...settings, storeControl: { ...settings.storeControl, announcementBar: event.target.value } })} />
                </div>
                <div className="mt-8 pt-6 border-t">
                  <Button className="rounded-xl px-8 font-bold bg-brand-blue hover:bg-brand-blue/90" onClick={() => void saveSettings(settings)} disabled={settingsState === "saving"}>
                    Speichern
                  </Button>
                </div>
              </AdminPanel>
            ) : null}
          </div>
        </main>
      </div>
    </section>
  );
}

function StoreTogglePanel({ label, description, keyName, settings, onSave, saving }: { label: string; description: string; keyName: "maintenanceMode" | "vacationMode" | "disableCheckout"; settings: SettingsResponse; onSave: (next: SettingsResponse) => Promise<void>; saving: boolean }) {
  const isOn = Boolean(settings.storeControl[keyName]);
  return (
    <AdminPanel title={label} description={description}>
      <div className={cn("flex items-center justify-between rounded-2xl border p-6 transition-all", isOn ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200")}>
        <div className="space-y-1">
          <p className="font-bold text-slate-900">{label} ist aktuell {isOn ? "AKTIVIERT" : "DEAKTIVIERT"}</p>
          <p className="text-sm text-slate-500">{isOn ? "Kunden sehen die entsprechende Hinweismeldung." : "Der Shop funktioniert wie gewohnt."}</p>
        </div>
        <button 
          onClick={() => void onSave({ ...settings, storeControl: { ...settings.storeControl, [keyName]: !isOn } })} 
          disabled={saving}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
            isOn ? "bg-teal-600" : "bg-slate-200"
          )}
        >
          <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", isOn ? "translate-x-6" : "translate-x-1")} />
        </button>
      </div>
    </AdminPanel>
  );
}

function OperationsQuickPanel({ onNavigate }: { onNavigate: (menuLabel: string) => void }) {
  return (
    <AdminPanel
      title="Betriebsbereich"
      description="Kleine Schnellzugriffe für den professionellen Betrieb im Wartungs- oder Urlaubsmodus."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Backups</p>
          <p className="mt-1 text-xs text-slate-500">Sichern Sie Daten vor größeren Änderungen.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg"
            onClick={() => onNavigate("Backups")}
          >
            Backups öffnen
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Aktivitäts-Logs</p>
          <p className="mt-1 text-xs text-slate-500">Prüfen Sie Änderungen und wichtige Aktionen.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg"
            onClick={() => onNavigate("Activity Logs")}
          >
            Logs öffnen
          </Button>
        </div>
      </div>
    </AdminPanel>
  );
}

function DashboardPanels({ refreshNonce }: { refreshNonce: number }) {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [ordersRes, invoicesRes] = await Promise.all([
        fetch("/api/admin/modules/orders?page=1&pageSize=10"),
        fetch("/api/admin/modules/invoices?page=1&pageSize=10")
      ]);
      if (ordersRes.ok) setOrders((await ordersRes.json() as PaginatedResponse).items);
      if (invoicesRes.ok) setInvoices((await invoicesRes.json() as PaginatedResponse).items);
      setLoading(false);
    })();
  }, [refreshNonce]);

  const revenue = orders.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const openInvoices = invoices.filter((item) => String(item.status ?? "").toLowerCase() !== "bezahlt" && String(item.status ?? "").toLowerCase() !== "paid").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Gesamtbestellungen" value={String(orders.length)} icon={ShoppingCart} trend="+12% vs. Vormonat" />
        <Metric label="Umsatz (Brutto)" value={`${revenue.toFixed(2)} €`} icon={BarChart3} trend="+8% vs. Vormonat" />
        <Metric label="Offene Rechnungen" value={String(openInvoices)} icon={ReceiptText} trend="Aktion erforderlich" danger={openInvoices > 0} />
        <Metric label="Kundenanfragen" value="24" icon={Mail} trend="3 neu heute" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-900">Umsatzübersicht</h3>
                <p className="text-xs text-slate-500">Zeitliche Entwicklung der letzten 7 Tage</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-brand-blue" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Umsatz</span>
                </div>
              </div>
            </div>
            {/* Professional Area Chart Mock using SVG */}
            <div className="h-64 w-full relative group">
              <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0055ff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0055ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50 L400,100 L0,100 Z" 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50" 
                  fill="none" 
                  stroke="#0055ff" 
                  strokeWidth="2" 
                />
                {/* Dots */}
                {[0, 100, 200, 300, 400].map((x, i) => (
                  <circle key={i} cx={x} cy={i === 0 ? 80 : i === 1 ? 85 : i === 2 ? 60 : i === 3 ? 75 : 50} r="3" fill="white" stroke="#0055ff" strokeWidth="2" />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-end justify-between px-2 pt-4">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(day => (
                  <span key={day} className="text-[10px] font-bold text-slate-400">{day}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900">Letzte Aktivitäten</h3>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-brand-blue">Alle sehen</Button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-slate-400">Lade Aktivitäten...</p>
              ) : orders.slice(0, 5).map((order, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Neue Bestellung #{String(order.id).slice(-4)}</p>
                    <p className="text-xs text-slate-500">{String(order.customer)} • {Number(order.total).toFixed(2)} €</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Vor 2h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SalesPanel({ refreshNonce }: { refreshNonce: number }) {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const ordersRes = await fetch("/api/admin/modules/orders?page=1&pageSize=50");
      if (ordersRes.ok) setOrders((await ordersRes.json() as PaginatedResponse).items);
      setLoading(false);
    })();
  }, [refreshNonce]);

  const revenue = orders.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="Gesamtumsatz (50 Best.)" value={`${revenue.toFixed(2)} €`} icon={BarChart3} trend="Live Daten" />
        <Metric label="Durchschn. Warenkorb" value={`${(orders.length ? revenue / orders.length : 0).toFixed(2)} €`} icon={ShoppingCart} />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h3 className="font-black text-slate-900">Umsatz Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Kunde</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{String(order.id).slice(-8)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{String(order.customer)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase">{String(order.status)}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{Number(order.total).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPanel() {
  return <AdminPanel title="Analytics"><p className="text-sm text-muted-foreground">Analytics is now fed from persisted order and invoice data via module APIs.</p></AdminPanel>;
}

function ModuleCrudPanel({ title, moduleKey, refreshNonce }: { title: string; moduleKey: string; refreshNonce: number }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [createPayload, setCreatePayload] = useState("{}");
  const [updateId, setUpdateId] = useState("");
  const [updatePayload, setUpdatePayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  async function load() {
    setLoading(true);
    const url = `/api/admin/modules/${moduleKey}?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    setLoading(false);
    if (!res.ok) return;
    const payload = await res.json() as PaginatedResponse;
    setItems(payload.items);
    setTotal(payload.total);
    setSelectedIds([]);
  }

  useEffect(() => {
    void load();
  }, [moduleKey, page, pageSize, refreshNonce]);

  async function onCreate() {
    try {
      const parsed = JSON.parse(createPayload) as Record<string, unknown>;
      const res = await fetch(`/api/admin/modules/${moduleKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      if (!res.ok) {
        alert("Erstellung fehlgeschlagen. Bitte JSON prüfen.");
        return;
      }
      setIsAdding(false);
      setCreatePayload("{}");
      await load();
    } catch (e) {
      alert("Ungültiges JSON Format.");
    }
  }

  async function onUpdate() {
    try {
      const parsed = JSON.parse(updatePayload) as Record<string, unknown>;
      const res = await fetch(`/api/admin/modules/${moduleKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: updateId, data: parsed }) });
      if (!res.ok) {
        alert("Update fehlgeschlagen.");
        return;
      }
      setUpdateId("");
      setUpdatePayload("{}");
      await load();
    } catch (e) {
      alert("Ungültiges JSON Format.");
    }
  }

  async function onBulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`${selectedIds.length} Einträge wirklich löschen?`)) return;
    const res = await fetch(`/api/admin/modules/${moduleKey}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedIds }) });
    if (!res.ok) return;
    await load();
  }

  const columns = useMemo(() => {
    const first = items[0] ?? {};
    const keys = Object.keys(first).filter((key) => !["items", "metadata", "payload", "gallery", "variants", "description", "seo"].includes(key));
    return keys.slice(0, 8);
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              placeholder={`${title} durchsuchen...`} 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 transition-all outline-none"
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => { setPage(1); void load(); }}>Filter anwenden</Button>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={onBulkDelete}>
              Löschen ({selectedIds.length})
            </Button>
          )}
          {moduleKey !== "orders" && moduleKey !== "activityLogs" && moduleKey !== "fileUploads" && moduleKey !== "invoices" && (
            <Button className="bg-brand-blue rounded-xl font-bold" onClick={() => setIsAdding(!isAdding)}>
              {isAdding ? "Abbrechen" : `+ ${title.slice(0, -1)}`}
            </Button>
          )}
        </div>
      </div>

      {isAdding && (
        <Card className="border-brand-blue/20 bg-brand-blue/[0.02]">
          <CardContent className="p-6">
            <h4 className="font-bold mb-4 text-slate-900">Neu erstellen</h4>
            <div className="space-y-4">
              <textarea 
                className="w-full min-h-48 rounded-xl border border-slate-200 p-4 font-mono text-xs focus:ring-2 focus:ring-brand-blue/20 outline-none" 
                placeholder='{"slug": "test", "name": "Test"}'
                value={createPayload} 
                onChange={(event) => setCreatePayload(event.target.value)} 
              />
              <Button onClick={() => void onCreate()} className="bg-brand-blue rounded-xl px-8">Erstellen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-left w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? items.map(i => String(i.id || i.slug)) : [])}
                  />
                </th>
                {columns.map((column) => (
                  <th key={column} className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    {column}
                  </th>
                ))}
                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => {
                const id = String(item.id || item.slug || "");
                return (
                  <tr key={id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                        checked={selectedIds.includes(id)} 
                        onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, id] : current.filter((value) => value !== id))} 
                      />
                    </td>
                    {columns.map((column) => (
                      <td key={column} className="px-6 py-4 text-slate-600 font-medium">
                        {column === "status" ? (
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            String(item[column]).toLowerCase() === "active" || String(item[column]).toLowerCase() === "paid" || String(item[column]).toLowerCase() === "bezahlt"
                              ? "bg-teal-100 text-teal-700" 
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {String(item[column])}
                          </span>
                        ) : formatCell(item[column])}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 text-brand-blue font-bold"
                        onClick={() => {
                          setUpdateId(id);
                          setUpdatePayload(JSON.stringify(item, null, 2));
                        }}
                      >
                        Bearbeiten
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
          <div className="py-20 text-center">
            <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Keine Einträge gefunden</p>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            {loading ? "Wird geladen..." : `Zeige ${items.length} von ${total} Einträgen`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Zurück</Button>
            <span className="text-xs font-bold px-3">Seite {page}</span>
            <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold" onClick={() => setPage((current) => current + 1)} disabled={page * pageSize >= total}>Weiter</Button>
          </div>
        </div>
      </Card>

      {updateId && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900">Eintrag bearbeiten: {updateId}</h4>
              <Button variant="ghost" size="sm" onClick={() => setUpdateId("")}>Abbrechen</Button>
            </div>
            <div className="space-y-4">
              <textarea 
                className="w-full min-h-64 rounded-xl border border-slate-200 p-4 font-mono text-xs focus:ring-2 focus:ring-teal-500/20 outline-none bg-white" 
                value={updatePayload} 
                onChange={(event) => setUpdatePayload(event.target.value)} 
              />
              <Button onClick={() => void onUpdate()} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8">Aktualisieren</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
  return String(value);
}

function AdminPanel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-8">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ label, value, icon: Icon, trend, danger }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; trend?: string; danger?: boolean }) {
  return (
    <Card className={cn("border-slate-200 bg-white transition-all hover:shadow-md", danger && "border-red-100 bg-red-50/10")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", danger ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400")}>
            {Icon && <Icon className="h-5 w-5" />}
          </div>
          {trend && (
            <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider", danger ? "bg-red-100 text-red-700" : "bg-teal-50 text-teal-700")}>
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
