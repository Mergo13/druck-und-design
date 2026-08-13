"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCUMENT_FOOTER } from "@/lib/legal";

export function CheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id") || "");
    localStorage.removeItem("dud_cart");
    window.dispatchEvent(new Event("dud-cart-updated"));
  }, []);

  return (
    <section className="container-page py-16">
      <h1 className="text-4xl font-black">Zahlung erfolgreich</h1>
      <p className="mt-4 text-muted-foreground">Vielen Dank. Ihre Stripe-Zahlung wurde abgeschlossen.</p>
      {sessionId ? <p className="mt-2 text-sm text-muted-foreground">Session: {sessionId}</p> : null}
      <p className="mt-6 max-w-xl text-xs leading-5 text-muted-foreground">{LEGAL_DOCUMENT_FOOTER}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link href="/produkte">Weiter einkaufen</Link></Button>
        <Button asChild variant="outline"><Link href="/konto">Zum Konto</Link></Button>
      </div>
    </section>
  );
}
