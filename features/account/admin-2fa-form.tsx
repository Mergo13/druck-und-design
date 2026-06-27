"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminTwoFactorForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function requestCode() {
    setRequesting(true);
    setMessage("");
    const response = await fetch("/api/auth/admin-2fa/request", { method: "POST" });
    const payload = await response.json().catch(() => ({} as { message?: string; sent?: boolean; code?: string }));
    if (!response.ok) {
      setMessage(payload.message ?? "Code konnte nicht angefordert werden.");
      setRequesting(false);
      return;
    }
    setDevCode(payload.code ?? "");
    setMessage(payload.sent ? "2FA-Code wurde per E-Mail gesendet." : "2FA-Code erstellt. (Dev-Fallback aktiv)");
    setRequesting(false);
  }

  useEffect(() => {
    void requestCode();
  }, []);

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/admin-2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const payload = await response.json().catch(() => ({} as { message?: string }));
    if (!response.ok) {
      setMessage(payload.message ?? "Verifizierung fehlgeschlagen.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void verifyCode(event)} className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
      <h1 className="text-3xl font-black">Admin 2FA</h1>
      <p className="mt-2 text-sm text-muted-foreground">Bitte geben Sie den 6-stelligen Code ein.</p>
      <label className="mt-6 grid gap-2 text-sm font-bold">
        2FA Code
        <Input required value={code} maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
      </label>
      <Button className="mt-6 w-full" disabled={loading}>{loading ? "Prüft..." : "Code bestätigen"}</Button>
      <Button type="button" variant="outline" className="mt-3 w-full" disabled={requesting} onClick={() => void requestCode()}>
        {requesting ? "Wird gesendet..." : "Code erneut senden"}
      </Button>
      {devCode ? <p className="mt-3 text-xs text-amber-700">Dev Code: {devCode}</p> : null}
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </form>
  );
}
