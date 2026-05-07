export function LegalPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="container-page max-w-3xl py-14">
      <h1 className="text-4xl font-black">{title}</h1>
      <p className="mt-6 leading-8 text-muted-foreground">{text}</p>
      <h2 className="mt-10 text-2xl font-black">CMS-Hinweis</h2>
      <p className="mt-3 leading-8 text-muted-foreground">Die Inhalte sind strukturiert vorbereitet und können später über ein Headless CMS mit Versionierung, Freigabeprozess und lokaler Rechtsprüfung gepflegt werden.</p>
    </section>
  );
}
