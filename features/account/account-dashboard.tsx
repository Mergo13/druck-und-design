"use client";

import { FileText, MapPin, Package, Settings, Upload, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const items: Array<[LucideIcon, string, string]> = [
  [Package, "Projekte", "Status Ihrer aktuellen Projekte"],
  [FileText, "Rechnungen", "Belege und Zahlungsstatus"],
  [Upload, "Druckdaten", "Übermittelte Druckdaten und Freigaben"],
  [MapPin, "Adressen", "Liefer- und Rechnungsadressen"],
  [Settings, "Kontoeinstellungen", "Team, Sicherheit und Benachrichtigungen"]
];

export function AccountDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");

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
    <section className="container-page py-10">
      <p className="font-bold text-primary">Kundenkonto</p>
      <h1 className="mt-2 text-4xl font-black">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Angemeldet als {email}</p>
      <Button className="mt-4" variant="outline" onClick={() => void logout()}>Ausloggen</Button>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([Icon, title, text]) => (
          <div className="rounded-lg border p-6 shadow-soft" key={title}>
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-5 text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-black">Letzte Anfragen & Projekte</h2>
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-muted-foreground">Aktuell sind keine Anfragen oder Projekte hinterlegt.</p>
        </div>
      </div>
    </section>
  );
}
