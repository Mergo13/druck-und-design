"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const payload = await response.json().catch(() => ({} as { message?: string; resetUrl?: string }));
    setMessage(payload.message ?? "Wenn ein Konto existiert, senden wir einen Link zum Zuruecksetzen.");
    setResetUrl(payload.resetUrl ?? "");
    setLoading(false);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
      <h1 className="text-3xl font-black">Passwort vergessen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Geben Sie die E-Mail-Adresse Ihres Kontos ein.</p>
      <label className="mt-6 grid gap-2 text-sm font-bold">
        E-Mail
        <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <Button className="mt-6 w-full" disabled={loading}>{loading ? "Bitte warten..." : "Reset-Link senden"}</Button>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {resetUrl ? (
        <p className="mt-3 break-words text-xs text-amber-700">
          Dev-Link: <Link className="font-bold underline" href={resetUrl}>{resetUrl}</Link>
        </p>
      ) : null}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link className="font-bold text-primary" href="/login">Zurueck zum Login</Link>
      </p>
    </form>
  );
}
