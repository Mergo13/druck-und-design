export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://druck-und-design.at").replace(/\/+$/, "");

export const companySeo = {
  name: "druck&design studio",
  legalName: "druck&design studio, Mergim Izairi",
  url: siteUrl,
  logo: `${siteUrl}/brand/logo-dud.png`,
  email: "kontakt@druck-und-design.at",
  phone: "+43 7242 63239",
  address: {
    streetAddress: "Roseggerstraße 11",
    postalCode: "4600",
    addressLocality: "Wels",
    addressRegion: "Oberösterreich",
    addressCountry: "AT"
  },
  openingHours: ["Mo-Th 08:00-18:00", "Fr 08:00-14:00"],
  serviceArea: ["Wels", "Wels-Land", "Linz", "Linz-Land", "Eferding", "Oberösterreich"]
};

export const localSeoPages = [
  {
    slug: "druckerei-wels",
    title: "Druckerei Wels",
    heading: "Druckerei in Wels für Unternehmen, Vereine und Gastronomie",
    description: "Druckerei in Wels für Flyer, Visitenkarten, Broschüren, Plakate, Speisekarten und Geschäftsdrucksorten mit persönlicher Beratung.",
    region: "Wels",
    services: ["Flyer drucken", "Visitenkarten", "Broschüren", "Plakate", "Speisekarten", "Druckdatencheck"]
  },
  {
    slug: "werbetechnik-wels",
    title: "Werbetechnik Wels",
    heading: "Werbetechnik in Wels: Schilder, Folien, Banner und Montage",
    description: "Werbetechnik in Wels für Fahrzeugbeschriftung, Fensterfolierung, Schilder, Banner, Aufkleber, Roll-ups und Großformatdruck.",
    region: "Wels",
    services: ["Fahrzeugbeschriftung", "Fensterfolierung", "Schilder", "Banner", "Aufkleber", "Montage"]
  },
  {
    slug: "werbeagentur-wels",
    title: "Werbeagentur Wels",
    heading: "Werbeagentur in Wels für Design, Branding und Webdesign",
    description: "Werbeagentur in Wels für Logo, Corporate Design, Webdesign, Werbemittel, Kampagnen und Druckproduktion aus einer Hand.",
    region: "Wels",
    services: ["Corporate Design", "Logo", "Webdesign", "Grafikdesign", "Werbemittel", "Druckproduktion"]
  },
  {
    slug: "textildruck-wels",
    title: "Textildruck Wels",
    heading: "Textildruck in Wels für Arbeitskleidung, Teams und Vereine",
    description: "Textildruck in Wels für Arbeitskleidung, Teamwear, Shirts, Polos, Hoodies und Merch mit Beratung zu Material und Umsetzung.",
    region: "Wels",
    services: ["Arbeitskleidung", "Teamwear", "Shirts", "Polos", "Hoodies", "Merch"]
  },
  {
    slug: "fahrzeugbeschriftung-wels",
    title: "Fahrzeugbeschriftung Wels",
    heading: "Fahrzeugbeschriftung in Wels für Firmenautos und Flotten",
    description: "Fahrzeugbeschriftung in Wels: Planung, Druck, Folie und Beschriftung für Firmenfahrzeuge, Transporter und Flotten.",
    region: "Wels",
    services: ["Firmenfahrzeuge", "Transporter", "Flotten", "Folien", "Digitaldruck", "Montage"]
  },
  {
    slug: "fensterfolierung-wels",
    title: "Fensterfolierung Wels",
    heading: "Fensterfolierung in Wels für Geschäftslokale und Büros",
    description: "Fensterfolierung in Wels für Sichtschutz, Schaufenster, Öffnungszeiten, Logos, Glasflächen und Verkaufsräume.",
    region: "Wels",
    services: ["Sichtschutz", "Schaufenster", "Logos", "Glasflächen", "Beschriftung", "Montage"]
  },
  {
    slug: "schilder-wels",
    title: "Schilder Wels",
    heading: "Schilder in Wels für Firmen, Ordinationen und Gastronomie",
    description: "Schilder in Wels: Firmenschilder, Bautafeln, Wegweiser, Alu-Dibond, Platten und robuste Beschriftung für innen und außen.",
    region: "Wels",
    services: ["Firmenschilder", "Bautafeln", "Wegweiser", "Alu-Dibond", "Platten", "Außenwerbung"]
  },
  {
    slug: "grossformatdruck-wels",
    title: "Großformatdruck Wels",
    heading: "Großformatdruck in Wels für Plakate, Banner und Werbeflächen",
    description: "Großformatdruck in Wels für Plakate, Banner, Roll-ups, Schilder, Folien und Werbeflächen mit sauberer Druckdatenprüfung.",
    region: "Wels",
    services: ["Plakate", "Banner", "Roll-ups", "Schilder", "Folien", "Werbeflächen"]
  },
  {
    slug: "druckerei-wels-land",
    title: "Druckerei Wels-Land",
    heading: "Druck und Werbetechnik für Wels-Land",
    description: "Druckerei und Werbetechnik für Unternehmen aus Wels-Land: Drucksorten, Beschriftung, Textildruck, Schilder und Webdesign.",
    region: "Wels-Land",
    services: ["Drucksorten", "Beschriftung", "Textildruck", "Schilder", "Werbemittel", "Webdesign"]
  },
  {
    slug: "druckerei-linz",
    title: "Druckerei Linz",
    heading: "Druckerei und Werbetechnik für Linz",
    description: "Druckerei-Leistungen für Linz: Flyer, Visitenkarten, Broschüren, Plakate, Werbetechnik, Textildruck und Webdesign aus Oberösterreich.",
    region: "Linz",
    services: ["Flyer", "Visitenkarten", "Broschüren", "Werbetechnik", "Textildruck", "Webdesign"]
  },
  {
    slug: "werbetechnik-linz",
    title: "Werbetechnik Linz",
    heading: "Werbetechnik für Linz: Folien, Schilder und Fahrzeugbeschriftung",
    description: "Werbetechnik für Linz mit Beratung, Druckdatencheck und Umsetzung für Fahrzeuge, Schaufenster, Schilder, Banner und POS.",
    region: "Linz",
    services: ["Fahrzeugbeschriftung", "Schaufenster", "Schilder", "Banner", "POS", "Folien"]
  },
  {
    slug: "druckerei-linz-land",
    title: "Druckerei Linz-Land",
    heading: "Druck und Werbetechnik für Linz-Land",
    description: "Druckerei, Werbetechnik, Textildruck und Werbeagentur-Leistungen für Betriebe in Linz-Land und Oberösterreich.",
    region: "Linz-Land",
    services: ["Druckerei", "Werbetechnik", "Textildruck", "Werbeagentur", "Schilder", "Geschäftsdruck"]
  },
  {
    slug: "druckerei-eferding",
    title: "Druckerei Eferding",
    heading: "Druckerei und Werbetechnik für Eferding",
    description: "Druck, Werbetechnik, Schilder, Textildruck und Webdesign für Unternehmen, Vereine und Gastronomie im Raum Eferding.",
    region: "Eferding",
    services: ["Druck", "Werbetechnik", "Schilder", "Textildruck", "Gastronomie", "Webdesign"]
  }
] as const;

export type LocalSeoPage = typeof localSeoPages[number];

export function getLocalSeoPage(slug: string) {
  return localSeoPages.find((page) => page.slug === slug);
}

export function localBusinessJsonLd(pathname = "/") {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${siteUrl}/#localbusiness`,
    name: companySeo.name,
    legalName: companySeo.legalName,
    url: `${siteUrl}${pathname}`,
    logo: companySeo.logo,
    image: companySeo.logo,
    email: companySeo.email,
    telephone: companySeo.phone,
    address: {
      "@type": "PostalAddress",
      ...companySeo.address
    },
    openingHours: companySeo.openingHours,
    areaServed: companySeo.serviceArea.map((name) => ({ "@type": "AdministrativeArea", name })),
    priceRange: "$$",
    knowsAbout: [
      "Druckerei",
      "Werbetechnik",
      "Werbeagentur",
      "Textildruck",
      "Fahrzeugbeschriftung",
      "Fensterfolierung",
      "Schilder",
      "Großformatdruck",
      "Webdesign"
    ]
  };
}
