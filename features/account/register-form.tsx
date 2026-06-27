"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, email, password })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Registrierung fehlgeschlagen." }));
      setMessage(payload.message ?? "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }
    router.push("/leistungen");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
      <h1 className="text-3xl font-black">Konto erstellen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nur eingeloggte Kunden können Produkte auswählen und Angebote senden.</p>
      <label className="mt-6 grid gap-2 text-sm font-bold">Firma<Input value={company} onChange={(event) => setCompany(event.target.value)} /></label>
      <label className="mt-4 grid gap-2 text-sm font-bold">E-Mail<Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="mt-4 grid gap-2 text-sm font-bold">Passwort<Input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <Button className="mt-6 w-full" disabled={loading}>{loading ? "Bitte warten..." : "Registrieren"}</Button>
      {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
    </form>
  );
}
