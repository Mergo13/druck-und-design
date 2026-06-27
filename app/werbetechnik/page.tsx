import { ServicePortfolioPage } from "@/components/service-portfolio-page";
import { Maximize, Palette, Map, Construction } from "lucide-react";

export const metadata = {
  title: "Werbetechnik | druck&design",
  description: "Sichtbarkeit, die beeindruckt. Banner, Schilder und Fahrzeugbeklebung in Wels von druck&design."
};

const features = [
  {
    icon: Maximize,
    title: "Großformatdruck",
    description: "Beeindruckende Banner und XXL-Poster für maximale Aufmerksamkeit im Innen- und Außenbereich."
  },
  {
    icon: Palette,
    title: "Fahrzeugbeklebung",
    description: "Ihre Flotte als rollende Werbefläche. Hochwertige Folien und präzise Montage für langlebige Werbung."
  },
  {
    icon: Map,
    title: "Leitsysteme",
    description: "Orientierung mit Design. Wir entwickeln und installieren Beschilderungen für Gebäude und Firmengelände."
  },
  {
    icon: Construction,
    title: "Montageservice",
    description: "Vom Entwurf bis zur fertigen Installation vor Ort – wir kümmern uns um den gesamten Prozess."
  }
];

const portfolio = [
  {
    title: "Werbetechnik Projekt 1",
    category: "Werbetechnik",
    image: "/uploads/werbetechnik.jpg"
  },
  {
    title: "Werbetechnik Projekt 2",
    category: "Werbetechnik",
    image: "/uploads/werbetechnik2.jpg"
  },
  {
    title: "Werbetechnik Projekt 3",
    category: "Werbetechnik",
    image: "/uploads/werbetechnik3.jpg"
  }
];

export default function WerbetechnikPage() {
  return (
    <ServicePortfolioPage
      title="Sichtbarkeit auf jedem Format."
      subtitle="druck&design Werbetechnik"
      description="Wir machen Ihre Marke unübersehbar. Mit moderner Werbetechnik sorgen wir für einen professionellen Auftritt, der bleibt – am Gebäude, am Fahrzeug oder am Point of Sale."
      features={features}
      portfolio={portfolio}
      ctaText="Werbetechnik-Produkte"
      ctaLink="/leistungen"
    />
  );
}
