"use client";

import { useEffect, useState } from "react";

type StoreControlPayload = {
  maintenanceMode: boolean;
  disableCheckout: boolean;
};

export function ShopStatusBadge() {
  const [control, setControl] = useState<StoreControlPayload | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/storefront/control", { cache: "no-store" });
        if (!res.ok) return;
        setControl(await res.json() as StoreControlPayload);
      } catch {
        setControl(null);
      }
    })();
  }, []);

  const inactive = Boolean(control?.maintenanceMode || control?.disableCheckout);

  return (
    <div className={inactive
      ? "mt-5 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm"
      : "mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"}
    >
      <span className={inactive ? "h-2 w-2 rounded-full bg-red-500" : "h-2 w-2 rounded-full bg-emerald-500"} />
      {inactive ? "Online Shop deaktiviert" : "Online Shop aktiv"}
    </div>
  );
}
