import type { BlogPost, Category, Product } from "@/types";

export const categories: Category[] = [
  { slug: "flyer-drucken", name: "Flyer & Falzflyer", description: "Kampagnenstarke Drucksachen in Premiumqualität.", icon: "Layers" },
  { slug: "visitenkarten", name: "Visitenkarten", description: "Starke erste Eindrücke mit Veredelung und feinen Papieren.", icon: "Badge" },
  { slug: "broschueren", name: "Broschüren", description: "Magazine, Kataloge und Preislisten für hochwertige Markenauftritte.", icon: "BookOpen" },
  { slug: "textildruck", name: "Textildruck", description: "Shirts, Hoodies und Arbeitskleidung mit langlebigem Druck.", icon: "Shirt" },
  { slug: "aufkleber", name: "Aufkleber", description: "Etiketten, Sticker und Folien für Innen und Außen.", icon: "Sticker" },
  { slug: "werbetechnik", name: "Werbetechnik", description: "Roll-ups, Schilder, Banner und Displays für maximale Sichtbarkeit.", icon: "PanelTop" }
];

export const products: Product[] = [
  {
    slug: "premium-flyer",
    name: "Premium Flyer",
    category: "flyer-drucken",
    short: "Matte, glänzende oder recycelte Flyer ab 25 Stück.",
    description: "Ideal für Aktionen, Events und lokale Kampagnen. Wählbar mit Softtouch, partieller Lackierung und Express-Produktion.",
    priceFrom: 24.9,
    rating: 4.9,
    delivery: "ab morgen",
    tags: ["Bestseller", "Same Day"],
    seo: "Flyer drucken lassen mit schneller Lieferung, präzisem Datencheck und hochwertigen Papieren.",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    slug: "business-visitenkarten",
    name: "Business Visitenkarten",
    category: "visitenkarten",
    short: "Stabile Karten mit optionaler Heißfolie oder Letterpress-Effekt.",
    description: "Für Teams, Gründer und Agenturen, die sich professionell und wiedererkennbar präsentieren möchten.",
    priceFrom: 19.5,
    rating: 4.8,
    delivery: "2-4 Werktage",
    tags: ["Premium", "Veredelung"],
    seo: "Visitenkarten drucken mit Premium-Papieren, Veredelung und schneller Nachbestellung.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    slug: "imagebroschuere",
    name: "Imagebroschüre",
    category: "broschueren",
    short: "Geklammerte oder klebegebundene Broschüren für Marken und Vertrieb.",
    description: "Präsentieren Sie Leistungen, Produkte und Referenzen in einer hochwertigen Broschüre mit sauberer Bindung.",
    priceFrom: 89,
    rating: 4.7,
    delivery: "4-6 Werktage",
    tags: ["B2B", "Katalog"],
    seo: "Broschüren drucken für Unternehmen mit Datenprüfung, Proof und verlässlicher Produktion.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    slug: "team-shirts",
    name: "Team Shirts",
    category: "textildruck",
    short: "Textildruck für Teams, Events und Workwear.",
    description: "Robuste Baumwoll- und Performance-Textilien mit Siebdruck, DTF oder Stick.",
    priceFrom: 12.9,
    rating: 4.9,
    delivery: "5-8 Werktage",
    tags: ["Textil", "Teams"],
    seo: "Textildruck für Unternehmen, Vereine und Events mit langlebigem Druck und Größenmix.",
    image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    slug: "kontur-aufkleber",
    name: "Kontur-Aufkleber",
    category: "aufkleber",
    short: "Freiform-Sticker auf Bogen oder Rolle, wetterfest und brillant.",
    description: "Perfekt für Verpackung, Aktionen, Branding und Produktkennzeichnung im Innen- und Außenbereich.",
    priceFrom: 34.9,
    rating: 4.8,
    delivery: "3-5 Werktage",
    tags: ["Wetterfest", "Freiform"],
    seo: "Aufkleber drucken in Konturform, wetterfest, farbstark und schnell lieferbar.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    slug: "rollup-premium",
    name: "Roll-up Premium",
    category: "werbetechnik",
    short: "Stabiles Displaysystem mit brillanter Druckbahn und Tragetasche.",
    description: "Für Messen, Empfangsbereiche und Präsentationen mit zuverlässiger Mechanik.",
    priceFrom: 79,
    rating: 4.6,
    delivery: "2-3 Werktage",
    tags: ["Messe", "Express"],
    seo: "Roll-up drucken für Messen und Events mit hochwertiger Kassette und Express-Option.",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

export const posts: BlogPost[] = [
  { slug: "druckdaten-richtig-anlegen", title: "Druckdaten richtig anlegen: Der kompakte Profi-Guide", excerpt: "Beschnitt, Farbprofil und Auflösung einfach erklärt, damit Ihre Bestellung sofort produktionsreif ist.", category: "Druckwissen", author: "Lea Hoffmann", readTime: "6 Min.", date: "2026-04-18" },
  { slug: "marketing-material-fuer-events", title: "Welche Printprodukte Events wirklich stärker machen", excerpt: "Von Einladungen bis Roll-ups: So bauen Sie eine konsistente Eventstrecke.", category: "Marketing", author: "Jonas Weber", readTime: "5 Min.", date: "2026-04-02" },
  { slug: "textildruck-trends-2026", title: "Textildruck-Trends 2026 für Teams und Marken", excerpt: "Premium-Basics, dezente Platzierungen und langlebige Verfahren für moderne Workwear.", category: "Textil", author: "Mira Scholz", readTime: "4 Min.", date: "2026-03-21" }
];
