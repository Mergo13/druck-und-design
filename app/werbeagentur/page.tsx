import Link from "next/link";
import { ServicePortfolioPage } from "@/components/service-portfolio-page";
import GlitchVault from "@/components/glitchvault";
import { Button } from "@/components/ui/button";
import { PenTool, Target, Globe, BarChart } from "lucide-react";
import { WerbeagenturPricingSection } from "@/features/werbeagentur/pricing-section";

export const metadata = {
  title: "Werbeagentur | druck&design",
  description: "Kreative Konzepte für Ihren Erfolg. Von Logo-Design bis Corporate Identity – druck&design in Wels."
};

const features = [
  {
    icon: PenTool,
    title: "Logo & Branding",
    description: "Wir entwickeln unverwechselbare Identitäten, die Ihre Werte widerspiegeln und im Kopf bleiben."
  },
  {
    icon: Target,
    title: "Marketing-Strategie",
    description: "Zielgerichtete Kampagnen, die Ihre Zielgruppe erreichen und nachhaltiges Wachstum fördern."
  },
  {
    icon: Globe,
    title: "Digital Design",
    description: "Modernes Webdesign und Social Media Assets, die Ihre Marke in der digitalen Welt optimal präsentieren."
  },
  {
    icon: BarChart,
    title: "Kampagnen-Management",
    description: "Von der ersten Idee bis zur Auswertung: Wir steuern Ihre Marketingaktivitäten effizient und transparent."
  }
];

const portfolio = [
  {
    title: "Werbeagentur Projekt 1",
    category: "Werbeagentur",
    image: "/uploads/werbeagentur.jpg"
  },
  {
    title: "Werbeagentur Projekt 2",
    category: "Werbeagentur",
    image: "/uploads/werbeagentur2.jpg"
  },
  {
    title: "Werbeagentur Projekt 3",
    category: "Werbeagentur",
    image: "/uploads/werbeagentur3.jpg"
  }
];

export default function WerbeagenturPage() {
  return (
    <>
      <ServicePortfolioPage
        title="Kreativität, die Ihre Marke bewegt."
        subtitle="druck&design Werbeagentur"
        description="Design ist mehr als nur Ästhetik – es ist ein Werkzeug für Ihren Erfolg. Wir begleiten Sie strategisch und kreativ, um Ihre Botschaft klar und wirkungsvoll zu kommunizieren."
        features={features}
        portfolio={portfolio}
        ctaText="Dienstleistungen ansehen"
        ctaLink="/leistungen"
      />
      <section className="container-page pb-20">
        <GlitchVault className="w-full rounded-lg border border-slate-200 bg-white" glitchColor="#ec4899" glitchRadius={90}>
          <div className="p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-600">GlitchVault Showcase</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Branding Sprint fuer schnelle Markenergebnisse</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Konzept, Design, Werbemittel und digitale Assets in einem kompakten Ablauf. Ideal fuer neue Kampagnen, Relaunches und starke Sichtbarkeit im Vertrieb.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild><Link href="/leistungen">Jetzt starten</Link></Button>
              <Button asChild variant="outline"><Link href="/kontakt">Beratung buchen</Link></Button>
            </div>
          </div>
        </GlitchVault>
      </section>
      <WerbeagenturPricingSection />
    </>
  );
}
