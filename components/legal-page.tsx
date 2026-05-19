import { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="container-page max-w-3xl py-14">
      <h1 className="text-4xl font-black">{title}</h1>
      <div className="mt-8 space-y-6 leading-8 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
