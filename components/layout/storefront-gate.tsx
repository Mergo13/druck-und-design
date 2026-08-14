"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type StoreControlPayload = {
  maintenanceMode: boolean;
  vacationMode: boolean;
  disableCheckout: boolean;
  announcementBar: string;
  maintenanceAvailableAt?: string;
  isAdmin?: boolean;
};

export function StorefrontGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bypassesStorefrontGate = pathname.startsWith("/admin") || pathname === "/login";
  const [control, setControl] = useState<StoreControlPayload | null>(null);

  useEffect(() => {
    if (bypassesStorefrontGate) return;
    void (async () => {
      try {
        const res = await fetch("/api/storefront/control", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json() as StoreControlPayload;
        setControl(payload);
      } catch {
        setControl(null);
      }
    })();
  }, [bypassesStorefrontGate]);

  if (!bypassesStorefrontGate && control?.maintenanceMode && !control.isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Wartungsmodus</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Wir führen gerade Wartungsarbeiten durch</h1>
          <p className="mt-4 text-sm text-slate-300 md:text-base">
            Der Shop ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.
          </p>
          {control.maintenanceAvailableAt ? (
            <p className="mt-4 text-sm font-semibold text-emerald-300">
              Voraussichtlich wieder verfügbar ab: {control.maintenanceAvailableAt}
            </p>
          ) : null}
          {control.announcementBar ? (
            <p className="mt-6 rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
              {control.announcementBar}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <>
      {!bypassesStorefrontGate && control?.vacationMode ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Urlaubsmodus aktiv: Lieferzeiten können aktuell länger sein.
        </div>
      ) : null}
      {!bypassesStorefrontGate && control?.announcementBar ? (
        <div className="bg-slate-900 px-4 py-2 text-center text-xs font-semibold text-white">
          {control.announcementBar}
        </div>
      ) : null}
      {children}
    </>
  );
}
