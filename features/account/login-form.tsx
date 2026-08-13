"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Login fehlgeschlagen." }));
      setMessage(payload.message ?? "Login fehlgeschlagen.");
      setLoading(false);
      return;
    }
    const requestedPath = searchParams.get("next");
    const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/produkte";
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
      <h1 className="text-3xl font-black">Einloggen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Greifen Sie auf Warenkorb und Angebotsanfragen zu.</p>
      <label className="mt-6 grid gap-2 text-sm font-bold">E-Mail<Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="mt-4 grid gap-2 text-sm font-bold">Passwort<Input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <Button className="mt-6 w-full" disabled={loading}>{loading ? "Bitte warten..." : "Einloggen"}</Button>
      {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
      <p className="mt-5 text-center text-sm text-muted-foreground">Noch kein Konto? <Link className="font-bold text-primary" href="/registrierung">Jetzt registrieren</Link></p>
    </form>
  );
}
