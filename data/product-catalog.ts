import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export const platformCategories: ProductCategory[] = [
  { slug: "druckprodukte", name: "Druckprodukte", description: "Flyer, Karten, Broschüren und Geschäftsausstattung." },
  { slug: "werbetechnik", name: "Werbetechnik", description: "Banner, Schilder, Displays und POS-Systeme." },
  { slug: "kleidung-textilien", name: "Kleidung & Textilien", description: "Workwear, Teamwear und Merch im Textildruck." },
  { slug: "aufkleber", name: "Aufkleber", description: "Etiketten, Sticker und Folienlösungen." },
  { slug: "digitales-marketing", name: "Digitales Marketing", description: "Crossmedia-Assets und Kampagnenbegleitung." },
  { slug: "same-day", name: "Same Day", description: "Produktion am gleichen Tag für ausgewählte Produkte." },
  { slug: "direct-mailings", name: "Direct Mailings", description: "Adressierte Werbepost mit Druck + Versandabwicklung." },
  { slug: "copyshop", name: "Copyshop", description: "Bindungen, Laminierungen und Dokumentenservice." }
];

export const productCatalog: ProductCatalogItem[] = [
  {
    slug: "premium-flyer-a5",
    name: "Premium Flyer DIN A5",
    category: "druckprodukte",
    short: "Flyer mit Veredelung, Express und Preflight.",
    description: "Konfigurierbare Flyer für Kampagnen mit Materialwahl, Veredelung und Live-Preis.",
    seo: "Flyer drucken mit professionellem Datencheck, Variantenlogik und Expressproduktion.",
    heroImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.9,
    basePrice: 26.15,
    deliveryText: "ab morgen",
    tags: ["Bestseller", "Same Day"],
    variants: [
      {
        id: "flyer-standard",
        name: "Standard Flyer",
        skuPrefix: "FLY-A5",
        attributes: [
          { key: "material", label: "Material", type: "select", required: true, defaultValue: "bd-matt", options: [{ value: "bd-matt", label: "Bilderdruck matt" }, { value: "bd-glanz", label: "Bilderdruck glänzend" }, { value: "recycling", label: "Recyclingpapier", priceModifier: 3.15 }] },
          { key: "grammatur", label: "Grammatur", type: "select", required: true, defaultValue: "170", options: [{ value: "135", label: "135 g/m²" }, { value: "170", label: "170 g/m²" }, { value: "250", label: "250 g/m²", priceModifier: 5.25 }] },
          { key: "veredelung", label: "Veredelung", type: "select", required: true, defaultValue: "keine", options: [{ value: "keine", label: "Keine" }, { value: "softtouch", label: "Softtouch", priceModifier: 12.6 }, { value: "heissfolie", label: "Heißfolie Gold", priceModifier: 40.95 }] },
          { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 19.95, productionDaysModifier: -1 }, { value: "sameday", label: "Same Day", priceModifier: 47.25, productionDaysModifier: -2 }] }
        ],
        quantityRule: { min: 100, max: 10000, step: 50 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: 26.15 }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 0.04725 }]
      }
    ],
    production: { baseProductionDays: 3, expressAvailable: true, sameDayCutoff: "11:00", preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
  },
  {
    slug: "rollup-premium",
    name: "Roll-up Premium",
    category: "werbetechnik",
    short: "Messe-Display mit robustem System.",
    description: "Roll-up mit Material- und Lieferoptionen für Events und POS.",
    seo: "Roll-up drucken mit großformatigem Preflight und Produktionsmetadaten.",
    heroImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    gallery: ["https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80"],
    rating: 4.7,
    basePrice: 82.95,
    deliveryText: "2-3 Werktage",
    tags: ["Messe", "Express"],
    variants: [
      {
        id: "rollup-85x200",
        name: "85 x 200 cm",
        skuPrefix: "RUP-85200",
        attributes: [
          { key: "material", label: "Material", type: "select", required: true, defaultValue: "pvc", options: [{ value: "pvc", label: "PVC 510 g/m²" }, { value: "blockout", label: "Blockout", priceModifier: 8.4 }] },
          { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 30.45 }] }
        ],
        quantityRule: { min: 1, max: 200, step: 1 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: 82.95 }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 0.84 }]
      }
    ],
    production: { baseProductionDays: 4, expressAvailable: true, preflightProfile: "large-format", renderPipeline: "vector-first" }
  },
  {
    slug: "alu-dibond-schilder",
    name: "Alu-Dibond Schilder",
    category: "werbetechnik",
    short: "Robuste Firmenschilder für außen.",
    description: "Hochwertiger UV-Direktdruck auf 3mm Alu-Dibond Verbundplatten.",
    seo: "Alu-Dibond Schilder drucken mit UV-Schutz und optionalen Bohrungen.",
    heroImage: "https://images.unsplash.com/photo-1541462608141-ad60397d4574?auto=format&fit=crop&w=1200&q=80",
    gallery: ["https://images.unsplash.com/photo-1541462608141-ad60397d4574?auto=format&fit=crop&w=1200&q=80"],
    rating: 4.9,
    basePrice: 47.25,
    deliveryText: "3-4 Werktage",
    tags: ["Outdoor", "Premium"],
    variants: [
      {
        id: "dibond-3mm",
        name: "3 mm Alu-Dibond",
        skuPrefix: "ADB-3",
        attributes: [
          { key: "format", label: "Format", type: "select", required: true, defaultValue: "40x60", options: [{ value: "20x30", label: "20 x 30 cm" }, { value: "40x60", label: "40 x 60 cm", priceModifier: 26.25 }, { value: "60x80", label: "60 x 80 cm", priceModifier: 57.75 }] },
          { key: "bohrungen", label: "Bohrungen", type: "select", required: true, defaultValue: "keine", options: [{ value: "keine", label: "Keine" }, { value: "4-ecken", label: "4-fach Eckbohrung", priceModifier: 8.4 }] }
        ],
        quantityRule: { min: 1, max: 50, step: 1 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: 47.25 }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 15.75 }]
      }
    ],
    production: { baseProductionDays: 4, expressAvailable: true, preflightProfile: "large-format", renderPipeline: "pdf-x4" }
  },
  {
    slug: "spiralbindung",
    name: "Spiralbindung",
    category: "copyshop",
    short: "Wire-O Bindung für Dokumente.",
    description: "Professionelle Metall-Spiralbindung für Skripte, Berichte und Präsentationen.",
    seo: "Spiralbindung online konfigurieren mit Deckfolie und Rückenkarton.",
    heroImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    gallery: ["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80"],
    rating: 4.8,
    basePrice: 4.73,
    deliveryText: "Same Day möglich",
    tags: ["Express", "Dokumente"],
    variants: [
      {
        id: "wire-o-a4",
        name: "Wire-O Bindung DIN A4",
        skuPrefix: "BIN-W4",
        attributes: [
          { key: "seiten", label: "Seitenanzahl", type: "select", required: true, defaultValue: "50", options: [{ value: "20", label: "bis 20 Seiten" }, { value: "50", label: "bis 50 Seiten", priceModifier: 2.1 }, { value: "100", label: "bis 100 Seiten", priceModifier: 5.25 }] },
          { key: "cover", label: "Deckblatt", type: "select", required: true, defaultValue: "folie", options: [{ value: "keines", label: "Keines" }, { value: "folie", label: "Klarsichtfolie", priceModifier: 1.58 }] }
        ],
        quantityRule: { min: 1, max: 500, step: 1 },
        priceRules: [{ key: "basis", label: "Grundgebühr", type: "fixed", amount: 4.73 }, { key: "bindung", label: "Bindungspreis", type: "per-unit", amount: 2.63 }]
      }
    ],
    production: { baseProductionDays: 1, expressAvailable: true, sameDayCutoff: "14:00", preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
  }
];
