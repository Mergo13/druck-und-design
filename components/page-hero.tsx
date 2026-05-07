export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="border-b bg-slate-50">
      <div className="container-page py-14">
        <p className="font-bold text-primary">{eyebrow}</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}
