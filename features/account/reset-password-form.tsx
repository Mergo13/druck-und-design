"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmPassword) {
      setMessage("Die Passwoerter stimmen nicht ueberein.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const payload = await response.json().catch(() => ({} as { message?: string }));
    setMessage(payload.message ?? "Passwort konnte nicht aktualisiert werden.");
    setSuccess(response.ok);
    setLoading(false);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
      <h1 className="text-3xl font-black">Passwort zuruecksetzen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Legen Sie ein neues Passwort fuer Ihr Konto fest.</p>
      {!token ? <p className="mt-4 text-sm text-red-600">Reset-Link fehlt.</p> : null}
      <label className="mt-6 grid gap-2 text-sm font-bold">
        Neues Passwort
        <Input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <label className="mt-4 grid gap-2 text-sm font-bold">
        Passwort wiederholen
        <Input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>
      <Button className="mt-6 w-full" disabled={loading || !token || success}>{loading ? "Bitte warten..." : "Passwort speichern"}</Button>
      {message ? <p className={success ? "mt-3 text-sm text-emerald-700" : "mt-3 text-sm text-red-600"}>{message}</p> : null}
      {success ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link className="font-bold text-primary" href="/login">Zum Login</Link>
        </p>
      ) : null}
    </form>
  );
}
