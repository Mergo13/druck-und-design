import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type StudentArticleStatus = "draft" | "published";

export type StudentArticle = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  status: StudentArticleStatus;
  publishDate?: string | null;
  relatedProducts: string[];
  relatedArticles: string[];
  faqs: Array<{ question: string; answer: string }>;
  featured: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export const studentArticleCategories = [
  "Abschlussarbeit",
  "Bachelorarbeit",
  "Masterarbeit",
  "Dissertation",
  "Bindungen",
  "Druckvorbereitung",
  "Poster",
  "Skripten",
  "Tipps & Ratgeber"
];

export const studentLandingPages = [
  {
    slug: "fh-wels",
    title: "Studenten Druckservice für FH Wels",
    description: "Abschlussarbeiten, Skripten, Poster und Bindungen für Studierende in Wels, ohne offizielle Partnerschaftsbehauptung.",
    searchFocus: ["Bachelorarbeit drucken Wels", "Hardcover Bachelorarbeit Wels", "Studenten Copyshop Wels"]
  },
  {
    slug: "fh-oberoesterreich",
    title: "Drucken und Binden für Studierende in Oberösterreich",
    description: "Professioneller Druckservice für Abschlussarbeiten, Lernunterlagen und Wissenschaftsposter in Oberösterreich.",
    searchFocus: ["Abschlussarbeit drucken Oberösterreich", "Masterarbeit binden Wels", "Skripten drucken Oberösterreich"]
  },
  {
    slug: "jku-linz",
    title: "Studenten Druckservice für Linz und Umgebung",
    description: "Druck und Bindung von Bachelorarbeiten, Masterarbeiten, Dissertationen und Postern mit Abholung in Wels oder Versand.",
    searchFocus: ["Bachelorarbeit drucken Linz", "Dissertation binden Oberösterreich", "Wissenschaftsposter drucken"]
  }
];

const starterTopics = [
  ["bachelorarbeit-drucken-und-binden", "Bachelorarbeit drucken und binden: Darauf solltest du achten", "Bachelorarbeit", true],
  ["welche-bindung-bachelorarbeit", "Welche Bindung für die Bachelorarbeit?", "Bindungen", true],
  ["hardcover-oder-softcover", "Hardcover oder Softcover?", "Bindungen", true],
  ["papierstaerke-bachelorarbeit", "Bachelorarbeit drucken: Welche Papierstärke?", "Bachelorarbeit", false],
  ["einseitig-oder-doppelseitig", "Bachelorarbeit einseitig oder doppelseitig drucken?", "Druckvorbereitung", false],
  ["kosten-bachelorarbeit-drucken", "Was kostet das Drucken einer Bachelorarbeit?", "Bachelorarbeit", false],
  ["exemplare-bachelorarbeit", "Wie viele Exemplare der Bachelorarbeit brauche ich?", "Bachelorarbeit", false],
  ["masterarbeit-drucken-binden", "Masterarbeit richtig drucken und binden", "Masterarbeit", false],
  ["diplomarbeit-drucken-oesterreich", "Diplomarbeit drucken in Österreich", "Abschlussarbeit", false],
  ["dissertation-drucken-binden", "Dissertation drucken und binden", "Dissertation", false],
  ["gold-silberpraegung-abschlussarbeit", "Gold- oder Silberprägung bei Abschlussarbeiten", "Bindungen", false],
  ["pdf-fuer-druck-vorbereiten", "PDF für den Druck richtig vorbereiten", "Druckvorbereitung", true],
  ["beschnitt-seitenformat-seitenraender", "Beschnitt, Seitenformat und Seitenränder erklärt", "Druckvorbereitung", false],
  ["rgb-oder-cmyk-abschlussarbeiten", "RGB oder CMYK bei Abschlussarbeiten?", "Druckvorbereitung", false],
  ["bilder-abschlussarbeit-aufloesung", "Bilder in Abschlussarbeiten: richtige Auflösung", "Druckvorbereitung", false],
  ["wissenschaftsposter-richtig-gestalten", "Wissenschaftsposter richtig gestalten", "Poster", true],
  ["a0-a1-a2-posterformat", "A0, A1 oder A2: Welches Posterformat?", "Poster", false],
  ["wissenschaftsposter-universitaet-kongress", "Wissenschaftsposter für Universität und Kongress drucken", "Poster", false],
  ["skripten-guenstig-drucken-binden", "Skripten günstig drucken und binden", "Skripten", false],
  ["spiralbindung-oder-klebebindung", "Spiralbindung oder Klebebindung?", "Bindungen", false],
  ["checkliste-vor-abgabe-bachelorarbeit", "Checkliste vor Abgabe der Bachelorarbeit", "Tipps & Ratgeber", true],
  ["druckfehler-abschlussarbeiten-vermeiden", "Häufige Druckfehler bei Abschlussarbeiten vermeiden", "Tipps & Ratgeber", false],
  ["last-minute-abschlussarbeit-drucken", "Last-Minute Abschlussarbeit drucken", "Tipps & Ratgeber", false],
  ["abschlussarbeit-wels-drucken-binden", "Abschlussarbeit in Wels drucken und binden", "Abschlussarbeit", true],
  ["studenten-copyshop-wels", "Studenten Copyshop Wels", "Tipps & Ratgeber", false],
  ["copyshop-fh-studenten-oberoesterreich", "Copyshop für FH Studenten in Oberösterreich", "Tipps & Ratgeber", false]
] as const;

function articleBody(title: string, category: string) {
  return [
    `Dieser Ratgeber hilft dir, ${title.toLowerCase()} ruhig und strukturiert vorzubereiten. Im Mittelpunkt stehen druckfähige PDF-Dateien, passende Materialien und eine Bindung, die zu Abgabe, Umfang und gewünschter Wirkung passt.`,
    "Plane vor der Bestellung zuerst Format, Seitenzahl, Farbumfang und Anzahl der Exemplare. Bei Abschlussarbeiten lohnt sich ein kurzer Blick in die Vorgaben deiner Hochschule oder FH, weil Bindung, Deckblatt und einseitiger Druck manchmal vorgegeben sind.",
    "Für hochwertige Ergebnisse empfehlen wir klare PDF-Exporte, ausreichend große Bilder und saubere Seitenränder. Wenn du unsicher bist, kannst du vor der Produktion eine Beratung in Wels nutzen und deine Datei prüfen lassen.",
    category === "Poster"
      ? "Bei wissenschaftlichen Postern sind Lesbarkeit aus Distanz, klare Spalten und kontrastreiche Diagramme wichtiger als viele dekorative Elemente."
      : "Bei Bindungen entscheidet vor allem der Anlass: Spiralbindung ist praktisch, Klebebindung wirkt sauber, Hardcover ist die hochwertigste Lösung für Abschlussarbeiten."
  ].join("\n\n");
}

const starterArticles: StudentArticle[] = starterTopics.map(([slug, title, category, featured], index) => ({
  slug,
  title,
  category,
  featured,
  sortOrder: (index + 1) * 10,
  status: "published",
  publishDate: "2026-08-11T00:00:00.000Z",
  excerpt: `${title} - ein kompakter Leitfaden für Studierende in Wels und Oberösterreich.`,
  body: articleBody(title, category),
  featuredImage: "/uploads/products/abschlussarbeiten.webp",
  seoTitle: `${title} | Druck & Design Studio Wels`,
  metaDescription: `Praktische Tipps zu ${title.toLowerCase()} für Studierende in Österreich. Druck, Bindung und PDF-Vorbereitung in Wels.`,
  canonicalUrl: "",
  tags: [category, "Studenten", "Wels"],
  relatedProducts: ["abschlussarbeiten", "spiralbindung", "plakate"],
  relatedArticles: starterTopics.slice(0, 3).map(([relatedSlug]) => relatedSlug).filter((relatedSlug) => relatedSlug !== slug),
  faqs: [
    { question: "Kann ich meine PDF-Datei online hochladen?", answer: "Ja, die Produktkonfiguration nutzt den bestehenden Datei-Upload für Druckdaten." },
    { question: "Kann ich in Wels abholen?", answer: "Ja, Abholung in Wels ist im bestehenden Checkout als Lieferoption vorgesehen." }
  ]
}));

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function fromRow(row: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  featured: boolean;
  sortOrder: number;
  publishDate: Date | null;
  featuredImage: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  tags: unknown;
  body: string;
  faqs: unknown;
  relatedProducts: unknown;
  relatedArticles: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): StudentArticle {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    status: row.status === "published" ? "published" : "draft",
    featured: row.featured,
    sortOrder: row.sortOrder,
    publishDate: row.publishDate?.toISOString() ?? null,
    featuredImage: row.featuredImage,
    seoTitle: row.seoTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    body: row.body,
    faqs: Array.isArray(row.faqs) ? row.faqs as StudentArticle["faqs"] : [],
    relatedProducts: Array.isArray(row.relatedProducts) ? row.relatedProducts as string[] : [],
    relatedArticles: Array.isArray(row.relatedArticles) ? row.relatedArticles as string[] : [],
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString()
  };
}

async function ensureStudentArticlesSeeded() {
  const count = await prisma.studentArticle.count();
  if (count > 0) return;
  for (const article of starterArticles) {
    await upsertStudentArticle(article);
  }
}

export async function getStudentArticles({ includeDrafts = false } = {}) {
  await ensureStudentArticlesSeeded();
  const rows = await prisma.studentArticle.findMany({
    where: includeDrafts ? undefined : { status: "published" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishDate: "desc" }]
  });
  return rows.map(fromRow);
}

export async function getStudentArticleBySlug(slug: string, includeDrafts = false) {
  await ensureStudentArticlesSeeded();
  const row = await prisma.studentArticle.findFirst({
    where: includeDrafts ? { slug } : { slug, status: "published" }
  });
  return row ? fromRow(row) : null;
}

export async function upsertStudentArticle(article: StudentArticle) {
  const publishDate = article.publishDate ? new Date(article.publishDate) : null;
  const data = {
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    status: article.status ?? "draft",
    featured: article.featured ?? false,
    sortOrder: Number(article.sortOrder) || 0,
    publishDate,
    featuredImage: article.featuredImage || null,
    seoTitle: article.seoTitle || null,
    metaDescription: article.metaDescription || null,
    canonicalUrl: article.canonicalUrl || null,
    tags: asJson(article.tags ?? []),
    body: article.body,
    faqs: asJson(article.faqs ?? []),
    relatedProducts: asJson(article.relatedProducts ?? []),
    relatedArticles: asJson(article.relatedArticles ?? [])
  };
  const row = await prisma.studentArticle.upsert({
    where: { slug: article.slug },
    update: data,
    create: { slug: article.slug, ...data }
  });
  return fromRow(row);
}

export async function deleteStudentArticles(slugs: string[]) {
  await prisma.studentArticle.deleteMany({ where: { slug: { in: slugs } } });
}

