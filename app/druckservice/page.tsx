import { ServicePortfolioPage } from "@/components/service-portfolio-page";
import { Printer, Zap, ShieldCheck, Layers } from "lucide-react";
import { getSiteImageMap } from "@/lib/site-images";

export const metadata = {
  title: "Druckservice | druck&design",
  description: "Professionelle Druckdienstleistungen in Wels. Von Flyern bis zu komplexen Broschüren – wir liefern Qualität."
};

const features = [
  {
    icon: Printer,
    title: "High-End Druck",
    description: "Offset- und Digitaldruckmaschinen für brillante Ergebnisse auf verschiedensten Materialien."
  },
  {
    icon: Zap,
    title: "Express Produktion",
    description: "Wenn es schnell gehen muss: Wir realisieren viele Druckaufträge innerhalb von 24 Stunden."
  },
  {
    icon: ShieldCheck,
    title: "Druckdatencheck",
    description: "Wir prüfen Ihre Daten vor dem Druck auf Herz und Nieren, um Fehler und Fehldrucke zu vermeiden."
  },
  {
    icon: Layers,
    title: "Veredelung",
    description: "Laminieren, Prägen oder UV-Lack – wir verleihen Ihren Druckprodukten das gewisse Etwas."
  }
];

const portfolio = [
  {
    title: "Premium Magazine & Broschüren",
    category: "Printmedien",
    image: "/uploads/drucken.jpg"
  },
  {
    title: "Hochwertige Flyer & Werbemittel",
    category: "Marketing",
    image: "/uploads/drucken2.jpg"
  },
  {
    title: "Exklusive Visitenkarten",
    category: "Corporate",
    image: "/uploads/drucken3.jpg"
  }
];

export default async function DruckservicePage() {
  const siteImages = await getSiteImageMap();
  return (
    <ServicePortfolioPage
      title="Präzision im Druck. Qualität ohne Kompromisse."
      subtitle="druck&design Druckservice"
      description="Wir verwandeln Ihre digitalen Visionen in haptische Erlebnisse. Als Ihre Druckerei in Wels bieten wir maßgeschneiderte Lösungen für Geschäftskunden und Individualisten."
      features={features}
      portfolio={portfolio.map((item, index) => ({
        ...item,
        image: siteImages[`druckservice.portfolio.${index + 1}`] ?? item.image
      }))}
      ctaText="Druckprodukte entdecken"
      ctaLink="/leistungen"
    />
  );
}
