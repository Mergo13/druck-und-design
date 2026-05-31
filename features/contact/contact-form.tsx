"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  topic: z.string().min(2),
  message: z.string().min(10)
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [submitError, setSubmitError] = useState<string>("");
  const [serverSuccess, setServerSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setSubmitError("");
    setServerSuccess(false);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Anfrage konnte nicht gesendet werden." }));
      setSubmitError(payload.message || "Anfrage konnte nicht gesendet werden.");
      return;
    }
    setServerSuccess(true);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 shadow-premium">
      <h2 className="text-2xl font-black">Anfrage senden</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Name<Input {...register("name")} />{errors.name && <span className="text-xs text-red-600">Bitte Namen eingeben.</span>}</label>
        <label className="grid gap-2 text-sm font-bold">E-Mail<Input {...register("email")} />{errors.email && <span className="text-xs text-red-600">Bitte gültige E-Mail eingeben.</span>}</label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-bold">Thema<Input {...register("topic")} placeholder="z. B. Broschüre, Textildruck oder Rahmenvertrag" />{errors.topic && <span className="text-xs text-red-600">Bitte Thema eingeben.</span>}</label>
      <label className="mt-4 grid gap-2 text-sm font-bold">Nachricht<textarea {...register("message")} className="min-h-36 rounded-md border p-3 outline-none focus:ring-2 focus:ring-ring" />{errors.message && <span className="text-xs text-red-600">Bitte Nachricht ergänzen.</span>}</label>
      {serverSuccess && <p className="mt-4 rounded-md bg-fuchsia-50 p-3 text-sm font-bold text-fuchsia-900">Danke, Ihre Anfrage ist bei uns eingegangen.</p>}
      {submitError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{submitError}</p> : null}
      <Button className="mt-6" disabled={isSubmitting}>{isSubmitting ? "Wird gesendet..." : "Absenden"}</Button>
    </form>
  );
}
