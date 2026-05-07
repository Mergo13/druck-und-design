import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export const platformCategories: ProductCategory[] = [
  { slug: "druckprodukte", name: "Druckprodukte", description: "Flyer, Karten, Broschüren und Geschäftsausstattung." },
  { slug: "werbetechnik", name: "Werbetechnik", description: "Banner, Schilder, Displays und POS-Systeme." },
  { slug: "kleidung-textilien", name: "Kleidung & Textilien", description: "Workwear, Teamwear und Merch im Textildruck." },
  { slug: "aufkleber", name: "Aufkleber", description: "Etiketten, Sticker und Folienlösungen." },
  { slug: "digitales-marketing", name: "Digitales Marketing", description: "Crossmedia-Assets und Kampagnenbegleitung." },
  { slug: "same-day", name: "Same Day", description: "Produktion am gleichen Tag für ausgewählte Produkte." },
  { slug: "direct-mailings", name: "Direct Mailings", description: "Adressierte Werbepost mit Druck + Versandabwicklung." }
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
    basePrice: 24.9,
    deliveryText: "ab morgen",
    tags: ["Bestseller", "Same Day"],
    variants: [
      {
        id: "flyer-standard",
        name: "Standard Flyer",
        skuPrefix: "FLY-A5",
        attributes: [
          { key: "material", label: "Material", type: "select", required: true, defaultValue: "bd-matt", options: [{ value: "bd-matt", label: "Bilderdruck matt" }, { value: "bd-glanz", label: "Bilderdruck glänzend" }, { value: "recycling", label: "Recyclingpapier", priceModifier: 3 }] },
          { key: "grammatur", label: "Grammatur", type: "select", required: true, defaultValue: "170", options: [{ value: "135", label: "135 g/m²" }, { value: "170", label: "170 g/m²" }, { value: "250", label: "250 g/m²", priceModifier: 5 }] },
          { key: "veredelung", label: "Veredelung", type: "select", required: true, defaultValue: "keine", options: [{ value: "keine", label: "Keine" }, { value: "softtouch", label: "Softtouch", priceModifier: 12 }, { value: "heissfolie", label: "Heißfolie Gold", priceModifier: 39 }] },
          { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 19, productionDaysModifier: -1 }, { value: "sameday", label: "Same Day", priceModifier: 45, productionDaysModifier: -2 }] }
        ],
        quantityRule: { min: 100, max: 10000, step: 50 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: 24.9 }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 0.045 }]
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
    basePrice: 79,
    deliveryText: "2-3 Werktage",
    tags: ["Messe", "Express"],
    variants: [
      {
        id: "rollup-85x200",
        name: "85 x 200 cm",
        skuPrefix: "RUP-85200",
        attributes: [
          { key: "material", label: "Material", type: "select", required: true, defaultValue: "pvc", options: [{ value: "pvc", label: "PVC 510 g/m²" }, { value: "blockout", label: "Blockout", priceModifier: 8 }] },
          { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 29 }] }
        ],
        quantityRule: { min: 1, max: 200, step: 1 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: 79 }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 0.8 }]
      }
    ],
    production: { baseProductionDays: 4, expressAvailable: true, preflightProfile: "large-format", renderPipeline: "vector-first" }
  }
];
