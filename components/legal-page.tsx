import { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-slate-50/70 py-14 md:py-20">
      <div className="container-page max-w-4xl">
        <div className="border-l-4 border-brand-coral pl-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-blue">Rechtliche Informationen</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink md:text-6xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Stand: Juli 2026</p>
        </div>
        <div className="mt-10 space-y-10 border-y border-slate-200 bg-white px-6 py-9 leading-7 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,.06)] md:px-10">
          {children}
        </div>
      </div>
    </section>
  );
}
