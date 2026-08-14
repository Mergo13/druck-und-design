import { ServicePortfolioPage } from "@/components/service-portfolio-page";
import { Shirt, Users, Zap, Layers } from "lucide-react";

export const metadata = {
  title: "Kleidung & Textilien | druck&design",
  description: "Hochwertiger Textildruck in Wels. Workwear, Teamwear und Merch professionell bedruckt von druck&design."
};

const features = [
  {
    icon: Shirt,
    title: "Workwear & Business",
    description: "Professionelle Arbeitskleidung mit Ihrem Logo – robust, langlebig und im CI-konformen Design."
  },
  {
    icon: Users,
    title: "Team- & Vereinsbekleidung",
    description: "Einheitlicher Auftritt für Sportvereine, Feuerwehren oder Teams mit individuellen Namen und Nummern."
  },
  {
    icon: Zap,
    title: "Flexibler Textildruck",
    description: "Ob Siebdruck, Digitaltransfer oder Flexdruck – wir wählen das optimale Verfahren für Ihr Motiv."
  },
  {
    icon: Layers,
    title: "Veredelung & Merch",
    description: "Vom T-Shirt bis zum Hoodie – wir erstellen hochwertiges Merchandising für Creator und Unternehmen."
  }
];

const portfolio = [
  {
    title: "Performance Team Shirts",
    category: "Sport & Event",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Premium Corporate Hoodies",
    category: "Workwear",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Individuelle Poloshirts",
    category: "Business",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1200&q=80"
  }
];

export default function KleidungTextilienPage() {
  return (
    <ServicePortfolioPage
      title="Ihre Marke zum Anziehen."
      subtitle="druck&design Kleidung & Textilien"
      description="Wir bringen Ihr Design auf hochwertigen Stoff. Von funktionaler Arbeitskleidung bis hin zu exklusivem Merchandising – wir bedrucken Textilien mit Präzision und Leidenschaft in Wels."
      features={features}
      portfolio={portfolio}
      ctaText="Produkte entdecken"
      ctaLink="/produkte"
    />
  );
}
