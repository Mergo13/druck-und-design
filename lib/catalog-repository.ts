import { promises as fs } from "fs";
import path from "path";
import generateRetailData from "data-generator-retail";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Order, UserAccount } from "@/types";
import type { GlobalProperty, ProductCatalogItem, ProductCategory, ProductIndustry } from "@/types/print-platform";

type LegacyPlatformDb = {
  categories: ProductCategory[];
  products: ProductCatalogItem[];
  orders: Order[];
  users?: UserAccount[];
  clientLogos?: string[];
};

const legacyDbPath = path.join(process.cwd(), "data", "platform-db.json");
const demoProductSlugs = new Set(["Flyer", "kontur-aufkleber-pro", "team-hoodie"]);
let catalogSeeded = false;
let industriesSeeded = false;

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function readLegacyDb(): Promise<LegacyPlatformDb> {
  const raw = await fs.readFile(legacyDbPath, "utf8");
  return JSON.parse(raw) as LegacyPlatformDb;
}

function demoCatalogFromLegacy(legacy: LegacyPlatformDb) {
  const products = (legacy.products ?? []).filter((product) => demoProductSlugs.has(product.slug));
  const categorySlugs = new Set(products.map((product) => product.category));
  const categories = (legacy.categories ?? []).filter((category) => categorySlugs.has(category.slug));
  return { categories, products };
}

async function ensureCatalogSeeded() {
  if (catalogSeeded) return;
  const [categoryCount, productCount, userCount] = await Promise.all([
    prisma.catalogCategory.count(),
    prisma.catalogProduct.count(),
    prisma.customerAccount.count()
  ]);
  if (categoryCount > 0 || productCount > 0 || userCount > 0) {
    catalogSeeded = true;
    return;
  }

  const legacy = await readLegacyDb().catch(() => null);
  if (!legacy) {
    catalogSeeded = true;
    return;
  }
  const demoCatalog = demoCatalogFromLegacy(legacy);

  await prisma.$transaction(async (tx) => {
    for (const category of demoCatalog.categories) {
      await tx.catalogCategory.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          slug: category.slug,
          name: category.name,
          visible: category.visible ?? true,
          published: category.published ?? true,
          data: asJson(category)
        }
      });
    }
    for (const product of demoCatalog.products) {
      await tx.catalogProduct.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: product.visible ?? true,
          published: product.published ?? true,
          data: asJson(product)
        }
      });
    }
    if (process.env.NODE_ENV !== "production") {
      for (const user of legacy.users ?? []) {
        await tx.customerAccount.upsert({
          where: { email: user.email.toLowerCase() },
          update: {},
          create: {
            id: user.id,
            email: user.email.toLowerCase(),
            passwordHash: user.passwordHash,
            data: asJson(user)
          }
        });
      }
    }
    if (legacy.clientLogos?.length) {
      await tx.clientLogoSet.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", logos: asJson(legacy.clientLogos) }
      });
    }
  });
  catalogSeeded = true;
}

function categoryFromRow(row: { data: unknown; slug: string; name: string; visible: boolean; published: boolean }) {
  return {
    ...(row.data as ProductCategory),
    slug: row.slug,
    name: row.name,
    visible: row.visible,
    published: row.published
  };
}

function productFromRow(row: { data: unknown; slug: string; name: string; category: string; visible: boolean; published: boolean }) {
  return {
    ...(row.data as ProductCatalogItem),
    slug: row.slug,
    name: row.name,
    category: row.category,
    visible: row.visible,
    published: row.published
  };
}

function propertyFromRow(row: { data: unknown; slug: string; name: string; active: boolean; sortOrder: number }, usageCount = 0): GlobalProperty {
  const data = row.data as Partial<GlobalProperty>;
  return {
    slug: row.slug,
    name: row.name,
    active: row.active,
    sortOrder: row.sortOrder,
    values: Array.isArray(data.values) ? data.values : [],
    usageCount
  };
}

function industryFromRow(row: { data: unknown; slug: string; name: string; visible: boolean; published: boolean; sortOrder: number; featured: boolean }) {
  return {
    ...(row.data as ProductIndustry),
    slug: row.slug,
    name: row.name,
    visible: row.visible,
    published: row.published,
    sortOrder: row.sortOrder,
    featured: row.featured
  };
}

function slugifyProperty(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `eigenschaft-${Date.now()}`;
}

const defaultIndustries: ProductIndustry[] = [
  {
    slug: "bau-handwerk",
    name: "Bau & Handwerk",
    description: "Robuste Beschriftung, Arbeitskleidung und Baustellen-Kommunikation für Handwerks- und Baubetriebe.",
    heroImage: "/uploads/werbetechnik.jpg",
    seoTitle: "Druck & Werbetechnik für Bau und Handwerk",
    metaDescription: "Fahrzeugbeschriftung, Arbeitskleidung, Bauzaunbanner, Schilder und Baustellentafeln für Bau- und Handwerksbetriebe.",
    sortOrder: 10,
    featured: true,
    productSlugs: ["Roll-up", "team-hoodie", "bodenaufkleber", "plakate"],
    solutionGroups: [
      { title: "Baustelle & Außenauftritt", items: ["Baustellentafeln", "Bauzaunbanner", "Schilder", "Fahrzeugbeschriftung"] },
      { title: "Team & Sicherheit", items: ["Arbeitskleidung", "Warnhinweise", "Bodenmarkierung"] }
    ],
    showroomImages: [
      { image: "/uploads/werbetechnik.jpg", title: "Fahrzeugbeschriftung", description: "Transporter und Firmenfahrzeuge mit klarer Markenwirkung." },
      { image: "/uploads/werbetechnik2.jpg", title: "Schilder & Tafeln", description: "Wetterfeste Orientierung und Baustellenkommunikation." },
      { image: "/brand/images/textil/Polo1.jpg", title: "Arbeitskleidung", description: "Textilien für Teams, Montage und Service." }
    ],
    serviceLinks: [
      { label: "Werbetechnik", href: "/werbetechnik" },
      { label: "Textildruck", href: "/textildruck-wels" },
      { label: "Kontakt", href: "/kontakt" }
    ]
  },
  {
    slug: "architektur-planung",
    name: "Architektur & Planung",
    description: "Großformatdruck, CAD-Pläne, Projektboards und hochwertige Präsentationsunterlagen.",
    heroImage: "/uploads/drucken.jpg",
    seoTitle: "Drucklösungen für Architektur und Planung",
    metaDescription: "CAD-Pläne, Großformatdruck, Projektboards, Broschüren und Bindungen für Architektur- und Planungsbüros.",
    sortOrder: 20,
    featured: true,
    productSlugs: ["abschlussarbeiten", "magazine", "plakate", "faltblaetter"],
    solutionGroups: [
      { title: "Planung & Präsentation", items: ["CAD Pläne", "Großformat", "Projektboards"] },
      { title: "Unterlagen", items: ["Broschüren", "Bindungen", "Präsentationsmappen"] }
    ],
    showroomImages: [
      { image: "/uploads/drucken.jpg", title: "Plan- und Großformatdruck", description: "Saubere Linien, starke Lesbarkeit und stabile Ausgabe." },
      { image: "/demo/broschuere.svg", title: "Projektunterlagen", description: "Broschüren, Dossiers und gebundene Unterlagen." }
    ],
    serviceLinks: [
      { label: "Druckservice", href: "/druckservice" },
      { label: "Großformatdruck", href: "/grossformatdruck-wels" }
    ]
  },
  {
    slug: "gastronomie-hotellerie",
    name: "Gastronomie & Hotellerie",
    description: "Speisekarten, Gutscheine, Fensterbeschriftung und hochwertige Ausstattung für Lokale und Hotels.",
    heroImage: "/uploads/werbeagentur.jpg",
    seoTitle: "Druck & Beschriftung für Gastronomie und Hotellerie",
    metaDescription: "Speisekarten, Fensterbeschriftung, Schilder, Tischaufsteller, Gutscheine und Teamkleidung für Gastro und Hotels.",
    sortOrder: 30,
    featured: true,
    productSlugs: ["flyer", "faltblaetter", "team-hoodie", "plakate"],
    solutionGroups: [
      { title: "Lokal & Karte", items: ["Speisekarten", "Tischaufsteller", "Getränkekarten", "Gutscheine"] },
      { title: "Außenwirkung", items: ["Fensterbeschriftung", "Schilder", "Arbeitskleidung"] }
    ],
    showroomImages: [
      { image: "/uploads/werbeagentur.jpg", title: "Speisekarten & Gutscheine", description: "Gedruckte Karten und Gutscheine passend zum Ambiente." },
      { image: "/uploads/werbetechnik3.jpg", title: "Fensterbeschriftung", description: "Öffnungszeiten, Aktionen und Sichtschutz für Gastroflächen." },
      { image: "/brand/images/textil/Polo2.jpg", title: "Teamkleidung", description: "Bestickte oder bedruckte Kleidung für Service und Küche." }
    ],
    serviceLinks: [
      { label: "Fensterfolierung", href: "/fensterfolierung-wels" },
      { label: "Werbeagentur", href: "/werbeagentur" },
      { label: "Kontakt", href: "/kontakt" }
    ]
  },
  {
    slug: "aerzte-praxen",
    name: "Ärzte & Praxen",
    description: "Diskrete, hochwertige Praxiskommunikation von Schildern bis Terminkarten.",
    heroImage: "/uploads/werbetechnik2.jpg",
    seoTitle: "Druck & Beschriftung für Ärzte und Praxen",
    metaDescription: "Praxisschilder, Sichtschutzfolie, Türbeschriftung, Terminkarten und Folder für Arztpraxen.",
    sortOrder: 40,
    featured: true,
    productSlugs: ["flyer", "faltblaetter", "bodenaufkleber"],
    solutionGroups: [
      { title: "Praxis vor Ort", items: ["Praxisschilder", "Sichtschutzfolie", "Türbeschriftung"] },
      { title: "Patientenkommunikation", items: ["Terminkarten", "Folder", "Informationsblätter"] }
    ],
    showroomImages: [
      { image: "/uploads/werbetechnik2.jpg", title: "Praxisschilder", description: "Klare Orientierung und seriöse Außenwirkung." },
      { image: "/uploads/drucken2.jpg", title: "Terminkarten & Folder", description: "Gedruckte Patienteninformationen im passenden Corporate Design." }
    ],
    serviceLinks: [
      { label: "Schilder", href: "/schilder-wels" },
      { label: "Fensterfolierung", href: "/fensterfolierung-wels" }
    ]
  },
  {
    slug: "einzelhandel",
    name: "Einzelhandel",
    description: "POS-Material, Schaufenster, Aktionen und Verpackungsbeilagen für Verkaufsflächen.",
    heroImage: "/uploads/werbetechnik3.jpg",
    seoTitle: "Druck und Werbetechnik für Einzelhandel",
    metaDescription: "Plakate, Bodenaufkleber, Fensterbeschriftung, Flyer und POS-Material für den Einzelhandel.",
    sortOrder: 50,
    featured: true,
    productSlugs: ["plakate", "bodenaufkleber", "flyer", "kontur-aufkleber-pro"],
    solutionGroups: [{ title: "Verkaufsfläche", items: ["Schaufenster", "Bodenaufkleber", "Aktionsplakate", "Regalhinweise"] }],
    showroomImages: [
      { image: "/uploads/werbetechnik3.jpg", title: "Schaufenster", description: "Aktionen und Öffnungszeiten sichtbar kommunizieren." },
      { image: "/uploads/drucken3.jpg", title: "POS-Drucksorten", description: "Flyer, Plakate und Beilagen für Kampagnen." }
    ],
    serviceLinks: [{ label: "Produkte", href: "/produkte" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "industrie-produktion",
    name: "Industrie & Produktion",
    description: "Kennzeichnung, Warnhinweise und langlebige Beschriftung für Produktion und Anlagen.",
    heroImage: "/uploads/werbetechnik.jpg",
    seoTitle: "Industriebeschriftung und Druck für Produktion",
    metaDescription: "Maschinenbeschriftung, Typenschilder, Warnschilder, Bodenmarkierung und Arbeitskleidung.",
    sortOrder: 60,
    featured: true,
    productSlugs: ["bodenaufkleber", "kontur-aufkleber-pro", "team-hoodie"],
    solutionGroups: [
      { title: "Kennzeichnung", items: ["Maschinenbeschriftung", "Typenschilder", "Warnschilder"] },
      { title: "Betrieb", items: ["Bodenmarkierung", "Arbeitskleidung", "Sicherheitsaufkleber"] }
    ],
    showroomImages: [
      { image: "/uploads/werbetechnik.jpg", title: "Maschinen & Anlagen", description: "Strapazierfähige Beschriftung für industrielle Umgebungen." },
      { image: "/uploads/products/1779214995978-m428ru17.png", title: "Dokumentation", description: "Handbücher, Magazine und technische Unterlagen." }
    ],
    serviceLinks: [{ label: "Werbetechnik", href: "/werbetechnik" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "immobilien",
    name: "Immobilien",
    description: "Verkaufstafeln, Exposés, Baustellenwerbung und Objektbeschriftung.",
    heroImage: "/uploads/drucken2.jpg",
    seoTitle: "Drucklösungen für Immobilien",
    metaDescription: "Exposés, Verkaufstafeln, Banner, Plakate und Objektbeschriftung für Immobilienprojekte.",
    sortOrder: 70,
    productSlugs: ["plakate", "faltblaetter", "Roll-up"],
    solutionGroups: [{ title: "Objektvermarktung", items: ["Exposés", "Verkaufstafeln", "Banner", "Projektboards"] }],
    showroomImages: [{ image: "/uploads/drucken2.jpg", title: "Exposés & Projektboards", description: "Hochwertige Präsentation für Verkauf und Vermietung." }],
    serviceLinks: [{ label: "Druckservice", href: "/druckservice" }, { label: "Werbetechnik", href: "/werbetechnik" }]
  },
  {
    slug: "vereine-sport",
    name: "Vereine & Sport",
    description: "Teamwear, Banner, Plakate und Vereinsdrucksorten für Auftritt und Events.",
    heroImage: "/brand/images/tshirt11.jpeg",
    seoTitle: "Druck und Textildruck für Vereine und Sport",
    metaDescription: "Teamshirts, Hoodies, Banner, Plakate, Flyer und Vereinsdrucksorten für Sport und Vereine.",
    sortOrder: 80,
    productSlugs: ["performance-shirt", "team-hoodie", "plakate", "flyer"],
    solutionGroups: [{ title: "Vereinsauftritt", items: ["Teamshirts", "Hoodies", "Banner", "Eventplakate"] }],
    showroomImages: [{ image: "/brand/images/tshirt11.jpeg", title: "Teamwear", description: "Shirts und Hoodies für Mannschaften und Vereine." }],
    serviceLinks: [{ label: "Textildruck", href: "/textildruck-wels" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "events",
    name: "Events",
    description: "Roll-ups, Plakate, Leitsysteme, Banner und Giveaways für Veranstaltungen.",
    heroImage: "/uploads/drucken3.jpg",
    seoTitle: "Eventdruck und Werbetechnik",
    metaDescription: "Roll-ups, Plakate, Banner, Aufkleber und Leitsysteme für Events und Veranstaltungen.",
    sortOrder: 90,
    productSlugs: ["Roll-up", "plakate", "flyer", "bodenaufkleber"],
    solutionGroups: [{ title: "Vor Ort sichtbar", items: ["Roll-ups", "Banner", "Plakate", "Leitsysteme"] }],
    showroomImages: [{ image: "/uploads/drucken3.jpg", title: "Eventkommunikation", description: "Sichtbare Ausstattung für Besucherführung und Aktionen." }],
    serviceLinks: [{ label: "Produkte", href: "/produkte" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "kunst-kreativ",
    name: "Kunst & Kreativ",
    description: "Prints, Portfolios, Sticker, kleine Editionen und Präsentationsmaterial für Kreative.",
    heroImage: "/uploads/werbeagentur2.jpg",
    seoTitle: "Druck für Kunst und Kreative",
    metaDescription: "Kunstdrucke, Sticker, Portfolios, Magazine und Kleinauflagen für kreative Projekte.",
    sortOrder: 100,
    productSlugs: ["kontur-aufkleber-pro", "magazine", "flyer"],
    solutionGroups: [{ title: "Edition & Präsentation", items: ["Sticker", "Magazine", "Portfolios", "Kleinauflagen"] }],
    showroomImages: [{ image: "/uploads/werbeagentur2.jpg", title: "Kreative Druckprojekte", description: "Materialien für Launches, Ausstellungen und Editionen." }],
    serviceLinks: [{ label: "Werbeagentur", href: "/werbeagentur" }, { label: "Druckservice", href: "/druckservice" }]
  },
  {
    slug: "unternehmen-bueros",
    name: "Unternehmen & Büros",
    description: "Geschäftsdrucksorten, Beschilderung, Präsentationen und Branding für Büros.",
    heroImage: "/uploads/drucken.jpg",
    seoTitle: "Druck und Branding für Unternehmen und Büros",
    metaDescription: "Flyer, Broschüren, Schilder, Präsentationen und Geschäftsdrucksorten für Unternehmen.",
    sortOrder: 110,
    featured: true,
    productSlugs: ["flyer", "faltblaetter", "magazine", "seo-content-paket"],
    solutionGroups: [{ title: "Unternehmenskommunikation", items: ["Flyer", "Broschüren", "Schilder", "Präsentationen"] }],
    showroomImages: [{ image: "/uploads/drucken.jpg", title: "Business Print", description: "Saubere Drucksorten und Markenunterlagen für den Alltag." }],
    serviceLinks: [{ label: "Produkte", href: "/produkte" }, { label: "Werbeagentur", href: "/werbeagentur" }]
  },
  {
    slug: "beauty-kosmetik",
    name: "Beauty & Kosmetik",
    description: "Preiskarten, Gutscheine, Fensterbeschriftung und Social-Media-nahe Drucksorten.",
    heroImage: "/uploads/werbeagentur3.jpg",
    seoTitle: "Druck für Beauty und Kosmetik",
    metaDescription: "Gutscheine, Preiskarten, Flyer, Fensterbeschriftung und Branding für Beauty- und Kosmetikstudios.",
    sortOrder: 120,
    productSlugs: ["flyer", "faltblaetter", "plakate"],
    solutionGroups: [{ title: "Studio & Aktionen", items: ["Preiskarten", "Gutscheine", "Fensterbeschriftung", "Flyer"] }],
    showroomImages: [{ image: "/uploads/werbeagentur3.jpg", title: "Beauty Branding", description: "Elegante Drucksorten für Studio, Aktion und Kundenbindung." }],
    serviceLinks: [{ label: "Fensterfolierung", href: "/fensterfolierung-wels" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "auto-mobilitaet",
    name: "Auto & Mobilität",
    description: "Fahrzeugbeschriftung, Flottenbranding, Aufkleber und Werkstattkommunikation.",
    heroImage: "/uploads/werbetechnik.jpg",
    seoTitle: "Fahrzeugbeschriftung und Druck für Mobilität",
    metaDescription: "Fahrzeugbeschriftung, Flottenbranding, Aufkleber, Schilder und Werkstattdrucksorten.",
    sortOrder: 130,
    productSlugs: ["kontur-aufkleber-pro", "flyer", "plakate"],
    solutionGroups: [{ title: "Fahrzeuge & Service", items: ["Fahrzeugbeschriftung", "Flottenbranding", "Aufkleber", "Schilder"] }],
    showroomImages: [{ image: "/uploads/werbetechnik.jpg", title: "Fahrzeugbeschriftung", description: "Mobile Werbung für Autos, Transporter und Flotten." }],
    serviceLinks: [{ label: "Fahrzeugbeschriftung", href: "/fahrzeugbeschriftung-wels" }, { label: "Kontakt", href: "/kontakt" }]
  },
  {
    slug: "schulen-bildung",
    name: "Schulen & Bildung",
    description: "Abschlussarbeiten, Infomaterial, Plakate, Beschilderung und Eventdruck.",
    heroImage: "/uploads/products/abschlussarbeiten.webp",
    seoTitle: "Druck für Schulen und Bildung",
    metaDescription: "Abschlussarbeiten, Plakate, Folder, Beschilderung und Drucksorten für Bildungseinrichtungen.",
    sortOrder: 140,
    productSlugs: ["abschlussarbeiten", "plakate", "flyer", "faltblaetter"],
    solutionGroups: [{ title: "Bildung & Kommunikation", items: ["Abschlussarbeiten", "Infomaterial", "Plakate", "Beschilderung"] }],
    showroomImages: [{ image: "/uploads/products/abschlussarbeiten.webp", title: "Abschlussarbeiten", description: "Drucken und Binden für Studierende und Bildungseinrichtungen." }],
    serviceLinks: [{ label: "Studenten Shop", href: "/studenten" }, { label: "Druckservice", href: "/druckservice" }]
  },
  {
    slug: "start-ups",
    name: "Start-ups",
    description: "Launch-Material, Branding, Sticker, Website-Content und erste Geschäftsdrucksorten.",
    heroImage: "/uploads/werbeagentur.jpg",
    seoTitle: "Druck und Design für Start-ups",
    metaDescription: "Branding, Flyer, Sticker, Präsentationen, Webdesign und Launch-Material für Start-ups.",
    sortOrder: 150,
    featured: true,
    productSlugs: ["kontur-aufkleber-pro", "flyer", "seo-content-paket"],
    solutionGroups: [{ title: "Launch & Marke", items: ["Branding", "Sticker", "Flyer", "Website-Content"] }],
    showroomImages: [{ image: "/uploads/werbeagentur.jpg", title: "Launchpakete", description: "Design, Print und digitale Grundlagen aus einer Hand." }],
    serviceLinks: [{ label: "Werbeagentur", href: "/werbeagentur" }, { label: "KI Design-Assistent", href: "/ki-design-assistent" }]
  }
];

async function ensureIndustriesSeeded() {
  if (industriesSeeded) return;
  const count = await prisma.catalogIndustry.count();
  if (count > 0) {
    industriesSeeded = true;
    return;
  }
  for (const industry of defaultIndustries) {
    await prisma.catalogIndustry.upsert({
      where: { slug: industry.slug },
      update: {},
      create: {
        slug: industry.slug,
        name: industry.name,
        visible: industry.visible ?? true,
        published: industry.published ?? true,
        sortOrder: industry.sortOrder ?? 0,
        featured: industry.featured ?? false,
        data: asJson(industry)
      }
    });
  }
  industriesSeeded = true;
}

export async function getCategories() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogCategory.findMany({ orderBy: { name: "asc" } });
  return rows.map(categoryFromRow);
}

export async function getProducts() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogProduct.findMany({ orderBy: { name: "asc" } });
  return rows.map(productFromRow);
}

export async function getGlobalProperties() {
  await ensureCatalogSeeded();
  let rows = await prisma.catalogProperty.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  if (!rows.length) {
    await seedGlobalPropertiesFromCatalog();
    rows = await prisma.catalogProperty.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }
  const products = await prisma.catalogProduct.findMany({ select: { data: true } });
  const usage = new Map<string, number>();
  for (const row of products) {
    const product = row.data as ProductCatalogItem;
    const seen = new Set<string>();
    for (const property of product.pricingProperties ?? []) {
      const key = property.propertyId || slugifyProperty(property.name);
      seen.add(key);
    }
    for (const key of seen) usage.set(key, (usage.get(key) ?? 0) + 1);
  }
  return rows.map((row) => propertyFromRow(row, usage.get(row.slug) ?? 0));
}

async function seedGlobalPropertiesFromCatalog() {
  const [products, categories] = await Promise.all([
    prisma.catalogProduct.findMany({ select: { data: true } }),
    prisma.catalogCategory.findMany({ select: { data: true } })
  ]);
  const bySlug = new Map<string, GlobalProperty>();
  const addValue = (propertyName: string, value: string, label?: string) => {
    if (!propertyName || !value) return;
    const slug = slugifyProperty(propertyName);
    const property = bySlug.get(slug) ?? { slug, name: propertyName, active: true, sortOrder: bySlug.size, values: [] };
    const valueId = slugifyProperty(`${slug}-${value}`);
    if (!property.values.some((entry) => entry.id === valueId || entry.value.toLowerCase() === value.toLowerCase())) {
      property.values.push({ id: valueId, value, label, active: true, sortOrder: property.values.length });
    }
    bySlug.set(slug, property);
  };
  for (const row of products) {
    const product = row.data as ProductCatalogItem;
    for (const property of product.pricingProperties ?? []) {
      for (const value of property.values ?? []) addValue(property.name, value.value, value.label);
    }
  }
  for (const row of categories) {
    const category = row.data as ProductCategory;
    for (const property of category.properties ?? []) {
      for (const entry of property.values ?? []) {
        if (typeof entry === "string") addValue(property.name, entry);
        else addValue(property.name, entry.value, entry.label);
      }
    }
  }
  for (const property of bySlug.values()) {
    await prisma.catalogProperty.upsert({
      where: { slug: property.slug },
      update: {},
      create: {
        slug: property.slug,
        name: property.name,
        active: true,
        sortOrder: property.sortOrder,
        data: asJson(property)
      }
    });
  }
}

export async function getGlobalProperty(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogProperty.findUnique({ where: { slug } });
  if (!row) return null;
  const usage = (await getGlobalProperties()).find((item) => item.slug === slug)?.usageCount ?? 0;
  return propertyFromRow(row, usage);
}

export async function upsertGlobalProperty(property: GlobalProperty, originalSlug?: string) {
  await ensureCatalogSeeded();
  const slug = property.slug || slugifyProperty(property.name);
  const nextProperty: GlobalProperty = {
    ...property,
    slug,
    active: property.active ?? true,
    sortOrder: Number(property.sortOrder) || 0,
    values: (property.values ?? []).map((value, index) => ({
      id: value.id || slugifyProperty(`${slug}-${value.value || index + 1}`),
      value: value.value,
      label: value.label,
      sortOrder: Number(value.sortOrder) || index,
      active: value.active ?? true
    }))
  };
  const targetSlug = originalSlug ?? slug;
  await prisma.$transaction(async (tx) => {
    if (targetSlug !== slug) {
      const linkedProducts = await tx.catalogProduct.findMany({ select: { slug: true, data: true } });
      for (const row of linkedProducts) {
        const product = row.data as ProductCatalogItem;
        const nextProperties = (product.pricingProperties ?? []).map((assigned) => {
          if ((assigned.propertyId || slugifyProperty(assigned.name)) !== targetSlug) return assigned;
          return { ...assigned, propertyId: slug, name: nextProperty.name };
        });
        if (JSON.stringify(nextProperties) !== JSON.stringify(product.pricingProperties ?? [])) {
          await tx.catalogProduct.update({
            where: { slug: row.slug },
            data: { data: asJson({ ...product, pricingProperties: nextProperties }) }
          });
        }
      }
      await tx.catalogProperty.delete({ where: { slug: targetSlug } });
    }
    await tx.catalogProperty.upsert({
      where: { slug },
      update: {
        name: nextProperty.name,
        active: nextProperty.active,
        sortOrder: nextProperty.sortOrder,
        data: asJson(nextProperty)
      },
      create: {
        slug,
        name: nextProperty.name,
        active: nextProperty.active,
        sortOrder: nextProperty.sortOrder,
        data: asJson(nextProperty)
      }
    });
  });
  return nextProperty;
}

export async function deleteGlobalProperty(slug: string) {
  await ensureCatalogSeeded();
  const products = await prisma.catalogProduct.findMany({ select: { data: true } });
  const isUsed = products.some((row) => {
    const product = row.data as ProductCatalogItem;
    return (product.pricingProperties ?? []).some((property) => (property.propertyId || slugifyProperty(property.name)) === slug);
  });
  if (isUsed) {
    await prisma.catalogProperty.update({ where: { slug }, data: { active: false } });
    return;
  }
  await prisma.catalogProperty.delete({ where: { slug } });
}

export async function getPublicCategories() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogCategory.findMany({
    where: { visible: true, published: true },
    orderBy: { name: "asc" }
  });
  return rows.map(categoryFromRow);
}

export async function getIndustries() {
  await ensureIndustriesSeeded();
  const rows = await prisma.catalogIndustry.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map(industryFromRow);
}

export async function getPublicIndustries() {
  await ensureIndustriesSeeded();
  const rows = await prisma.catalogIndustry.findMany({
    where: { visible: true, published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  return rows.map(industryFromRow);
}

export async function getIndustryBySlug(slug: string) {
  await ensureIndustriesSeeded();
  const row = await prisma.catalogIndustry.findUnique({ where: { slug } });
  return row ? industryFromRow(row) : null;
}

export async function getPublicIndustryBySlug(slug: string) {
  await ensureIndustriesSeeded();
  const row = await prisma.catalogIndustry.findFirst({ where: { slug, visible: true, published: true } });
  return row ? industryFromRow(row) : null;
}

export async function upsertIndustry(industry: ProductIndustry, originalSlug?: string) {
  await ensureIndustriesSeeded();
  const slug = industry.slug || slugifyProperty(industry.name);
  const nextIndustry: ProductIndustry = {
    ...industry,
    slug,
    visible: industry.visible ?? true,
    published: industry.published ?? true,
    sortOrder: Number(industry.sortOrder) || 0,
    featured: industry.featured ?? false,
    productSlugs: industry.productSlugs ?? [],
    serviceLinks: industry.serviceLinks ?? [],
    solutionGroups: industry.solutionGroups ?? [],
    showroomImages: industry.showroomImages ?? []
  };
  const targetSlug = originalSlug ?? slug;
  await prisma.$transaction(async (tx) => {
    if (targetSlug !== slug) {
      const products = await tx.catalogProduct.findMany({ select: { slug: true, data: true } });
      for (const row of products) {
        const product = row.data as ProductCatalogItem;
        const nextIndustrySlugs = (product.industrySlugs ?? []).map((item) => item === targetSlug ? slug : item);
        if (JSON.stringify(nextIndustrySlugs) !== JSON.stringify(product.industrySlugs ?? [])) {
          await tx.catalogProduct.update({
            where: { slug: row.slug },
            data: { data: asJson({ ...product, industrySlugs: nextIndustrySlugs }) }
          });
        }
      }
      await tx.catalogIndustry.delete({ where: { slug: targetSlug } });
    }
    await tx.catalogIndustry.upsert({
      where: { slug },
      update: {
        name: nextIndustry.name,
        visible: nextIndustry.visible ?? true,
        published: nextIndustry.published ?? true,
        sortOrder: nextIndustry.sortOrder ?? 0,
        featured: nextIndustry.featured ?? false,
        data: asJson(nextIndustry)
      },
      create: {
        slug,
        name: nextIndustry.name,
        visible: nextIndustry.visible ?? true,
        published: nextIndustry.published ?? true,
        sortOrder: nextIndustry.sortOrder ?? 0,
        featured: nextIndustry.featured ?? false,
        data: asJson(nextIndustry)
      }
    });
  });
  return nextIndustry;
}

export async function deleteIndustry(slug: string) {
  await ensureIndustriesSeeded();
  await prisma.$transaction(async (tx) => {
    const products = await tx.catalogProduct.findMany({ select: { slug: true, data: true } });
    for (const row of products) {
      const product = row.data as ProductCatalogItem;
      const nextIndustrySlugs = (product.industrySlugs ?? []).filter((item) => item !== slug);
      if (nextIndustrySlugs.length !== (product.industrySlugs ?? []).length) {
        await tx.catalogProduct.update({
          where: { slug: row.slug },
          data: { data: asJson({ ...product, industrySlugs: nextIndustrySlugs }) }
        });
      }
    }
    await tx.catalogIndustry.delete({ where: { slug } });
  });
}

export async function getPublicProducts() {
  await ensureCatalogSeeded();
  const visibleCategories = await prisma.catalogCategory.findMany({
    where: { visible: true, published: true },
    select: { slug: true }
  });
  const rows = await prisma.catalogProduct.findMany({
    where: {
      visible: true,
      published: true,
      category: { in: visibleCategories.map((item) => item.slug) }
    },
    orderBy: { name: "asc" }
  });
  return rows.map(productFromRow).filter((product) => (product.productStatus ?? "active") === "active");
}

export async function getProductBySlug(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogProduct.findUnique({ where: { slug } });
  return row ? productFromRow(row) : null;
}

export async function getPublicProductBySlug(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogProduct.findFirst({
    where: { slug, visible: true, published: true }
  });
  if (!row) return null;
  const category = await prisma.catalogCategory.findFirst({
    where: { slug: row.category, visible: true, published: true }
  });
  const product = productFromRow(row);
  if ((product.productStatus ?? "active") !== "active") return null;
  return category ? product : null;
}

export async function upsertCategory(category: ProductCategory, originalSlug?: string) {
  await ensureCatalogSeeded();
  const targetSlug = originalSlug ?? category.slug;
  await prisma.$transaction(async (tx) => {
    if (targetSlug !== category.slug) {
      const linked = await tx.catalogProduct.findMany({ where: { category: targetSlug } });
      for (const row of linked) {
        const data = { ...(row.data as ProductCatalogItem), category: category.slug };
        await tx.catalogProduct.update({
          where: { slug: row.slug },
          data: { category: category.slug, data: asJson(data) }
        });
      }
      await tx.catalogCategory.delete({ where: { slug: targetSlug } });
    }
    await tx.catalogCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        visible: category.visible ?? true,
        published: category.published ?? true,
        data: asJson(category)
      },
      create: {
        slug: category.slug,
        name: category.name,
        visible: category.visible ?? true,
        published: category.published ?? true,
        data: asJson(category)
      }
    });
  });
  return category;
}

export async function deleteCategory(slug: string) {
  await ensureCatalogSeeded();
  const linkedProducts = await prisma.catalogProduct.count({ where: { category: slug } });
  if (linkedProducts > 0) {
    throw new Error("Kategorie kann nicht gelöscht werden, solange Produkte zugeordnet sind.");
  }
  await prisma.catalogCategory.delete({ where: { slug } });
}

export async function upsertProduct(product: ProductCatalogItem) {
  await ensureCatalogSeeded();
  const category = await prisma.catalogCategory.findUnique({ where: { slug: product.category } });
  if (!category) throw new Error("Die gewählte Kategorie existiert nicht.");
  const productStatus = product.productStatus ?? (product.visible === false || product.published === false ? "inactive" : "active");
  const visible = productStatus === "active";
  const published = productStatus === "active";
  const nextProduct = { ...product, productStatus, visible, published, industrySlugs: product.industrySlugs ?? [] };
  await prisma.catalogProduct.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      category: product.category,
      visible,
      published,
      data: asJson(nextProduct)
    },
    create: {
      slug: product.slug,
      name: product.name,
      category: product.category,
      visible,
      published,
      data: asJson(nextProduct)
    }
  });
  return nextProduct;
}

export async function deleteProduct(slug: string) {
  await ensureCatalogSeeded();
  await prisma.catalogProduct.delete({ where: { slug } });
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.adminOrder.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    items: row.items as unknown as Order["items"],
    total: row.total,
    company: row.company ?? undefined,
    vatId: row.vatId ?? undefined,
    billingAddress: row.billingAddress ?? undefined,
    shippingAddress: row.shippingAddress ?? undefined,
    shippingCost: row.shippingCost ?? undefined,
    shippingName: row.shippingName ?? undefined,
    processingFee: row.processingFee ?? undefined,
    couponCode: row.couponCode ?? undefined,
    couponDiscount: row.couponDiscount ?? undefined,
    customerName: row.customer,
    customerEmail: row.email ?? undefined
  }));
}

export async function saveOrder(order: Order) {
  await prisma.adminOrder.upsert({
    where: { id: order.id },
    update: {
      customer: order.customerName || "Kunde",
      email: order.customerEmail,
      company: order.company,
      vatId: order.vatId,
      total: order.total,
      items: asJson(order.items),
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      shippingCost: order.shippingCost,
      shippingName: order.shippingName,
      processingFee: order.processingFee,
      couponCode: order.couponCode,
      couponDiscount: order.couponDiscount
    },
    create: {
      id: order.id,
      customer: order.customerName || "Kunde",
      email: order.customerEmail,
      company: order.company,
      vatId: order.vatId,
      total: order.total,
      status: "Neu",
      items: asJson(order.items),
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      shippingCost: order.shippingCost,
      shippingName: order.shippingName,
      processingFee: order.processingFee,
      couponCode: order.couponCode,
      couponDiscount: order.couponDiscount
    }
  });
  return order;
}

export async function getUsers() {
  await ensureCatalogSeeded();
  const rows = await prisma.customerAccount.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({ ...(row.data as UserAccount), id: row.id, email: row.email, passwordHash: row.passwordHash }));
}

export async function getUserByEmail(email: string) {
  await ensureCatalogSeeded();
  const row = await prisma.customerAccount.findUnique({ where: { email: email.toLowerCase() } });
  return row ? { ...(row.data as UserAccount), id: row.id, email: row.email, passwordHash: row.passwordHash } : null;
}

export async function saveUser(user: UserAccount) {
  await ensureCatalogSeeded();
  await prisma.customerAccount.upsert({
    where: { email: user.email.toLowerCase() },
    update: { passwordHash: user.passwordHash, data: asJson(user) },
    create: {
      id: user.id,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
      data: asJson(user)
    }
  });
  return user;
}

export async function deleteOrder(id: string) {
  await prisma.adminOrder.delete({ where: { id } });
}

export async function getClientLogos() {
  await ensureCatalogSeeded();
  const row = await prisma.clientLogoSet.findUnique({ where: { id: "default" } });
  return (row?.logos as string[] | undefined) ?? [];
}

export async function saveClientLogos(logos: string[]) {
  await ensureCatalogSeeded();
  const clientLogos = logos.filter(Boolean);
  await prisma.clientLogoSet.upsert({
    where: { id: "default" },
    update: { logos: asJson(clientLogos) },
    create: { id: "default", logos: asJson(clientLogos) }
  });
  return clientLogos;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function seedFromReactAdminDataGenerator() {
  const generated = generateRetailData();
  const demoProducts = generated.products.slice(0, 3);
  const demoCategoryIds = new Set(demoProducts.map((product) => product.category_id));
  const sourceCategories = generated.categories.filter((category) => demoCategoryIds.has(category.id));
  const categories: ProductCategory[] = sourceCategories.map((category) => ({
    slug: toSlug(category.name),
    name: category.name.charAt(0).toUpperCase() + category.name.slice(1),
    description: `Demo-Kategorie: ${category.name}.`,
    visible: true,
    published: true,
    defaultPropertyTemplate: "print-basic",
    quantitySteps: [1, 10, 50, 100, 500, 1000]
  }));
  const categoryIdToSlug = new Map(sourceCategories.map((category) => [category.id, toSlug(category.name)]));
  const products: ProductCatalogItem[] = demoProducts.map((product) => {
    const categorySlug = categoryIdToSlug.get(product.category_id) ?? "druckprodukte";
    const productSlug = toSlug(`${categorySlug}-${product.reference}-${product.id}`);
    const basePrice = Number(product.price.toFixed(2));
    return {
      slug: productSlug,
      name: product.reference,
      category: categorySlug,
      visible: true,
      published: true,
      short: `${product.reference} Demo-Produkt.`,
      description: product.description,
      seo: `${product.reference} in der Kategorie ${categorySlug}.`,
      heroImage: product.image,
      gallery: [product.image, product.thumbnail],
      rating: 4.5,
      basePrice,
      deliveryText: product.stock > 0 ? "3-5 Werktage" : "Auf Anfrage",
      tags: ["Demo", categorySlug],
      variants: [{
        id: `${productSlug}-default`,
        name: "Standard",
        skuPrefix: productSlug.toUpperCase().slice(0, 12),
        attributes: [{
          key: "size",
          label: "Format",
          type: "select",
          required: true,
          defaultValue: "standard",
          options: [{ value: "standard", label: `${Math.round(product.width)}x${Math.round(product.height)} cm` }]
        }],
        quantityRule: { min: 1, max: 5000, step: 1 },
        priceRules: [
          { key: "basis", label: "Basispreis", type: "fixed", amount: basePrice },
          { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: Number((basePrice * 0.1).toFixed(2)) }
        ]
      }],
      production: {
        baseProductionDays: 3,
        expressAvailable: product.stock > 0,
        preflightProfile: "standard-print",
        renderPipeline: "pdf-x4"
      },
      quantitySteps: [1, 10, 50, 100, 500, 1000],
      propertyTemplate: "print-basic"
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.catalogProduct.deleteMany();
    await tx.catalogCategory.deleteMany();
    for (const category of categories) {
      await tx.catalogCategory.create({
        data: {
          slug: category.slug,
          name: category.name,
          visible: true,
          published: true,
          data: asJson(category)
        }
      });
    }
    for (const product of products) {
      await tx.catalogProduct.create({
        data: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: true,
          published: true,
          data: asJson(product)
        }
      });
    }
  });
  return { categories: categories.length, products: products.length };
}

export async function resetDemoCatalog() {
  const legacy = await readLegacyDb();
  const demoCatalog = demoCatalogFromLegacy(legacy);
  if (demoCatalog.products.length !== 3) {
    throw new Error(`Demo-Katalog unvollständig: erwartet 3 Produkte, gefunden ${demoCatalog.products.length}.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.catalogProduct.deleteMany();
    await tx.catalogCategory.deleteMany();
    for (const category of demoCatalog.categories) {
      await tx.catalogCategory.create({
        data: {
          slug: category.slug,
          name: category.name,
          visible: category.visible ?? true,
          published: category.published ?? true,
          data: asJson(category)
        }
      });
    }
    for (const product of demoCatalog.products) {
      await tx.catalogProduct.create({
        data: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: product.visible ?? true,
          published: product.published ?? true,
          data: asJson(product)
        }
      });
    }
  });

  catalogSeeded = true;
  return { categories: demoCatalog.categories.length, products: demoCatalog.products.length };
}
