import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-premium">
        <h1 className="text-3xl font-black">Konto erstellen</h1>
        <p className="mt-2 text-sm text-muted-foreground">Für Teams, Agenturen und Unternehmen mit regelmäßigem Druckbedarf.</p>
        <label className="mt-6 grid gap-2 text-sm font-bold">Firma<Input /></label>
        <label className="mt-4 grid gap-2 text-sm font-bold">E-Mail<Input type="email" /></label>
        <label className="mt-4 grid gap-2 text-sm font-bold">Passwort<Input type="password" /></label>
        <Button className="mt-6 w-full">Registrieren</Button>
      </div>
    </section>
  );
}
