"use client";

import {
  Bell,
  ChevronDown,
  CreditCard,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  UserCircle2,
  X,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navigation: Array<[LucideIcon, string, string]> = [
  [LayoutDashboard, "Dashboard", "#"],
  [FolderKanban, "Projekte", "#projects"],
  [CreditCard, "Abrechnung", "#billing"],
  [LifeBuoy, "Support", "#support"],
  [Settings, "Einstellungen", "#"]
];

const projects = [
  { name: "Sommerkampagne 2026", type: "Messepaket", status: "In Produktion", progress: 72, due: "12. Juni 2026" },
  { name: "Storefront Rebranding", type: "Fensterfolierung", status: "Freigabe ausstehend", progress: 44, due: "18. Juni 2026" },
  { name: "Fleet Branding", type: "Fahrzeugbeklebung", status: "Planung", progress: 21, due: "25. Juni 2026" }
];

const invoices = [
  { id: "INV-2026-0418", description: "Produktion Werbemittel Q2", date: "14. Mai 2026", amount: "€3.420,00", status: "Bezahlt" },
  { id: "INV-2026-0431", description: "Druckdatenprüfung + Setup", date: "23. Mai 2026", amount: "€480,00", status: "Offen" },
  { id: "INV-2026-0442", description: "Teilrechnung Fahrzeugflotte", date: "28. Mai 2026", amount: "€1.950,00", status: "Fällig am 7. Juni" }
];

const tickets = [
  { id: "SUP-721", title: "Lieferadresse für Projekt ändern", priority: "Mittel", updated: "Heute, 09:14", state: "In Bearbeitung" },
  { id: "SUP-718", title: "Farbprofil für Banner-Export", priority: "Hoch", updated: "Gestern, 16:51", state: "Warten auf Antwort" },
  { id: "SUP-703", title: "Rückfrage zu Rechnungsposition", priority: "Niedrig", updated: "29. Mai 2026", state: "Gelöst" }
];

function projectStatusClass(status: string) {
  if (status === "In Produktion") return "bg-blue-100 text-blue-700";
  if (status === "Freigabe ausstehend") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function invoiceStatusClass(status: string) {
  if (status === "Bezahlt") return "bg-emerald-100 text-emerald-700";
  if (status === "Offen") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function ticketStatusClass(state: string) {
  if (state === "Gelöst") return "bg-emerald-100 text-emerald-700";
  if (state === "In Bearbeitung") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

export function AccountDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { authenticated: boolean; user?: { email?: string } }) => {
        setAuthenticated(Boolean(data.authenticated));
        setEmail(data.user?.email ?? "");
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!authenticated) {
    return (
      <section className="container-page py-10">
        <p className="font-bold text-primary">Kundenkonto</p>
        <h1 className="mt-2 text-4xl font-black">Bitte einloggen</h1>
        <div className="mt-6 flex gap-3">
          <Button asChild><Link href="/login">Einloggen</Link></Button>
          <Button asChild variant="outline"><Link href="/registrierung">Registrieren</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-6 md:py-8">
      <div className="overflow-hidden rounded-lg border bg-card/90 shadow-[0_20px_55px_rgba(15,23,42,.08)] backdrop-blur-sm">
        <div className="flex min-h-[calc(100vh-6rem)] flex-col lg:flex-row">
          <aside className="hidden w-72 shrink-0 border-r bg-muted/35 lg:flex lg:flex-col">
            <div className="border-b px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kundenkonto</p>
              <p className="mt-1 text-lg font-black">Studio Dashboard</p>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navigation.map(([Icon, label, href]) => (
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" href={href} key={label}>
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
            <div className="border-t p-4">
              <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Plan: Business</p>
                <p className="mt-1">Nächste Abrechnung am 14. Juni 2026</p>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b px-4 py-3 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setMobileMenuOpen((prev) => !prev)} size="icon" variant="outline" className="lg:hidden" aria-label="Menü öffnen">
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                  <div>
                    <h1 className="text-lg font-black md:text-2xl">Dashboard</h1>
                    <p className="text-xs text-muted-foreground md:text-sm">Angemeldet als {email}</p>
                  </div>
                </div>

                <div className="relative">
                  <Button onClick={() => setUserMenuOpen((prev) => !prev)} variant="outline" size="sm" className="pr-2">
                    <UserCircle2 className="h-4 w-4" />
                    <span className="max-w-[150px] truncate text-xs md:max-w-[220px] md:text-sm">{email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 z-20 w-48 rounded-md border bg-background p-1 shadow-lg">
                      <button className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted" type="button">
                        <Settings className="h-4 w-4" />
                        Kontoeinstellungen
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted" type="button">
                        <ShieldCheck className="h-4 w-4" />
                        Sicherheit
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={() => void logout()} type="button">
                        <LogOut className="h-4 w-4" />
                        Ausloggen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {mobileMenuOpen && (
                <nav className="mt-3 grid gap-1 rounded-md border bg-muted/35 p-2 lg:hidden">
                  {navigation.map(([Icon, label, href]) => (
                    <a
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
                      href={href}
                      key={label}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </a>
                  ))}
                </nav>
              )}
            </header>

            <main className="flex-1 space-y-6 p-4 md:p-6">
              <section id="projects">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Projektübersicht</h2>
                  <Button size="sm">Neues Projekt</Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <article className="rounded-md border bg-background p-4" key={project.name}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.type}</p>
                        </div>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${projectStatusClass(project.status)}`}>{project.status}</span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Fällig: {project.due}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
                        <div className="h-full rounded bg-primary" style={{ width: `${project.progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">{project.progress}% abgeschlossen</p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="billing">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Abrechnung</h2>
                  <Button size="sm" variant="outline">
                    <Bell className="h-4 w-4" />
                    Zahlungserinnerungen
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border bg-background">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Rechnung</th>
                        <th className="px-4 py-3">Leistung</th>
                        <th className="px-4 py-3">Datum</th>
                        <th className="px-4 py-3">Betrag</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr className="border-t" key={invoice.id}>
                          <td className="px-4 py-3 font-semibold">{invoice.id}</td>
                          <td className="px-4 py-3">{invoice.description}</td>
                          <td className="px-4 py-3 text-muted-foreground">{invoice.date}</td>
                          <td className="px-4 py-3 font-semibold">{invoice.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-2 py-1 text-xs font-semibold ${invoiceStatusClass(invoice.status)}`}>{invoice.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="support">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Support Tickets</h2>
                  <Button size="sm" variant="outline">
                    <HelpCircle className="h-4 w-4" />
                    Neues Ticket
                  </Button>
                </div>
                <div className="rounded-md border bg-background">
                  {tickets.map((ticket, index) => (
                    <article className="flex flex-col gap-2 border-b p-4 last:border-b-0 md:flex-row md:items-center md:justify-between" key={ticket.id}>
                      <div>
                        <p className="text-sm font-bold">{ticket.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ticket.id} • Priorität: {ticket.priority}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-1 font-semibold ${ticketStatusClass(ticket.state)}`}>{ticket.state}</span>
                        <span className="text-muted-foreground">{ticket.updated}</span>
                      </div>
                      {index === 0 ? <Package className="hidden h-4 w-4 text-primary md:block" /> : null}
                    </article>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}
