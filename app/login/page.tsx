import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
        <h1 className="text-3xl font-black">Einloggen</h1>
        <p className="mt-2 text-sm text-muted-foreground">Greifen Sie auf Bestellungen, Vorlagen und Nachbestellungen zu.</p>
        <label className="mt-6 grid gap-2 text-sm font-bold">E-Mail<Input type="email" /></label>
        <label className="mt-4 grid gap-2 text-sm font-bold">Passwort<Input type="password" /></label>
        <Button className="mt-6 w-full">Einloggen</Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">Noch kein Konto? <Link className="font-bold text-primary" href="/registrierung">Jetzt registrieren</Link></p>
      </div>
    </section>
  );
}
