import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type StudentArticleStatus = "draft" | "published";
export type StudentArticleSearchIntent = "informational" | "commercial" | "transactional" | "local";

export type StudentArticleProfile = {
  searchIntent: StudentArticleSearchIntent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetProductSlug: string;
  conversionGoal: string;
  ctaLabel: string;
  topicCluster: string;
};

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

export const studentArticleTopicClusters = [
  {
    title: "Abschlussarbeiten",
    description: "Bachelorarbeit, Masterarbeit, Diplomarbeit und Dissertation richtig drucken und binden.",
    categories: ["Abschlussarbeit", "Bachelorarbeit", "Masterarbeit", "Dissertation"]
  },
  {
    title: "Druckdaten & PDF",
    description: "PDF, Seitenformat, Farbe, Auflösung und Druckdaten sauber vorbereiten.",
    categories: ["Druckvorbereitung"]
  },
  {
    title: "Bindungen",
    description: "Spiralbindung, Klebebindung, Hardcover und Prägung richtig auswählen.",
    categories: ["Bindungen"]
  },
  {
    title: "Poster & Skripten",
    description: "Wissenschaftsposter, Lernunterlagen und Skripten für Studium und Unterricht.",
    categories: ["Poster", "Skripten"]
  },
  {
    title: "Wels & Abgabe",
    description: "Lokaler Druckservice, Last-Minute-Abgabe und Abholung in Wels.",
    categories: ["Tipps & Ratgeber"]
  }
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

const articleProfiles: Record<string, StudentArticleProfile> = {
  "bachelorarbeit-drucken-und-binden": {
    searchIntent: "transactional",
    primaryKeyword: "Bachelorarbeit drucken und binden",
    secondaryKeywords: ["Bachelorarbeit drucken Wels", "Bachelorarbeit binden", "Hardcover Bachelorarbeit"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "PDF hochladen und Abschlussarbeit konfigurieren",
    ctaLabel: "Bachelorarbeit konfigurieren",
    topicCluster: "Abschlussarbeiten"
  },
  "kosten-bachelorarbeit-drucken": {
    searchIntent: "commercial",
    primaryKeyword: "Was kostet eine Bachelorarbeit zu drucken",
    secondaryKeywords: ["Bachelorarbeit Druckkosten", "Kosten Spiralbindung", "Hardcover Bachelorarbeit Preis"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Preis mit echter Seitenzahl berechnen",
    ctaLabel: "PDF hochladen & Preis berechnen",
    topicCluster: "Abschlussarbeiten"
  },
  "last-minute-abschlussarbeit-drucken": {
    searchIntent: "commercial",
    primaryKeyword: "Last-Minute Abschlussarbeit drucken",
    secondaryKeywords: ["Abschlussarbeit Express Wels", "Bachelorarbeit schnell drucken", "Abgabe Deadline"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Schnell konfigurierbaren Druckauftrag starten",
    ctaLabel: "Abschlussarbeit jetzt konfigurieren",
    topicCluster: "Wels & Abgabe"
  },
  "abschlussarbeit-wels-drucken-binden": {
    searchIntent: "local",
    primaryKeyword: "Abschlussarbeit Wels drucken und binden",
    secondaryKeywords: ["Bachelorarbeit drucken Wels", "FH Wels Druckservice", "Hardcover Bachelorarbeit Wels"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Lokale Abholung oder Versand aus dem Konfigurator starten",
    ctaLabel: "Abschlussarbeit in Wels starten",
    topicCluster: "Wels & Abgabe"
  },
  "studenten-copyshop-wels": {
    searchIntent: "local",
    primaryKeyword: "Studenten Copyshop Wels",
    secondaryKeywords: ["Copyshop Wels Studenten", "Skripten drucken Wels", "Bachelorarbeit Wels"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Passendes Studentenprodukt auswählen",
    ctaLabel: "Studenten-Druckauftrag starten",
    topicCluster: "Wels & Abgabe"
  },
  "spiralbindung-oder-klebebindung": {
    searchIntent: "commercial",
    primaryKeyword: "Spiralbindung oder Klebebindung",
    secondaryKeywords: ["Bachelorarbeit Bindung", "Seminararbeit binden", "Skripten Spiralbindung"],
    targetProductSlug: "spiralbindung",
    conversionGoal: "Passende Bindung konfigurieren",
    ctaLabel: "Spiralbindung konfigurieren",
    topicCluster: "Bindungen"
  },
  "hardcover-oder-softcover": {
    searchIntent: "commercial",
    primaryKeyword: "Hardcover oder Softcover",
    secondaryKeywords: ["Hardcover Abschlussarbeit", "Bachelorarbeit binden", "Prägung Abschlussarbeit"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Hardcover-Abschlussarbeit konfigurieren",
    ctaLabel: "Hardcover konfigurieren",
    topicCluster: "Bindungen"
  },
  "pdf-fuer-druck-vorbereiten": {
    searchIntent: "informational",
    primaryKeyword: "PDF für den Druck vorbereiten",
    secondaryKeywords: ["PDF Druckdaten", "Bachelorarbeit PDF exportieren", "Druckdaten prüfen"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "PDF im Konfigurator prüfen lassen",
    ctaLabel: "PDF hochladen",
    topicCluster: "Druckdaten & PDF"
  },
  "rgb-oder-cmyk-abschlussarbeiten": {
    searchIntent: "informational",
    primaryKeyword: "RGB oder CMYK Abschlussarbeit",
    secondaryKeywords: ["Farbe Schwarz-Weiß Bachelorarbeit", "PDF Farbe prüfen", "Druckdaten Farbe"],
    targetProductSlug: "abschlussarbeiten",
    conversionGoal: "Druckart im Konfigurator wählen",
    ctaLabel: "Druckart konfigurieren",
    topicCluster: "Druckdaten & PDF"
  },
  "skripten-guenstig-drucken-binden": {
    searchIntent: "commercial",
    primaryKeyword: "Skripten günstig drucken und binden",
    secondaryKeywords: ["Lernunterlagen drucken", "Spiralbindung Skripten", "Studenten Druckservice"],
    targetProductSlug: "spiralbindung",
    conversionGoal: "Skript als PDF hochladen",
    ctaLabel: "Skript drucken",
    topicCluster: "Poster & Skripten"
  },
  "wissenschaftsposter-richtig-gestalten": {
    searchIntent: "commercial",
    primaryKeyword: "Wissenschaftsposter richtig gestalten",
    secondaryKeywords: ["Poster drucken Studenten", "A0 Poster Universität", "Wissenschaftsposter Druck"],
    targetProductSlug: "plakate",
    conversionGoal: "Posterformat auswählen und bestellen",
    ctaLabel: "Poster konfigurieren",
    topicCluster: "Poster & Skripten"
  }
};

const articleBodies: Record<string, string> = {
  "bachelorarbeit-drucken-und-binden": [
    "Wenn du deine Bachelorarbeit drucken und binden lässt, zählen vor allem drei Dinge: eine saubere PDF-Datei, die richtige Bindung und genug Zeit für Produktion und Abholung. Starte nicht mit der Optik, sondern mit den Vorgaben deiner Hochschule.",
    "## Was du vor der Bestellung klären solltest",
    "- Gibt es Vorgaben zu Hardcover, Klebebindung oder Spiralbindung?\n- Muss die Arbeit einseitig oder beidseitig gedruckt werden?\n- Wie viele Exemplare brauchst du für Abgabe, Betreuung und eigenes Archiv?\n- Sind farbige Diagramme wirklich farbig notwendig oder reicht Schwarz-Weiß?",
    "## Welche Bindung passt?",
    "Für finale Abgaben wirkt Hardcover am hochwertigsten, besonders wenn Titel, Name und Jahr geprägt werden sollen. Klebebindung ist eine moderne Alternative mit sauberem Rücken. Spiralbindung ist praktisch für Skripten, Arbeitsversionen und Seminararbeiten, aber nicht immer für offizielle Abschlussarbeiten erlaubt.",
    "## Direkt zum Preis",
    "Der zuverlässigste Weg ist der bestehende Produktkonfigurator: PDF hochladen, Seitenanzahl erkennen lassen, Druckart wählen, Bindung auswählen und den Preis berechnen. So vermeidest du Schätzpreise, die später nicht zur echten Datei passen."
  ].join("\n\n"),
  "kosten-bachelorarbeit-drucken": [
    "Der Preis einer Bachelorarbeit hängt nicht nur von der Seitenanzahl ab. Entscheidend sind Druckart, Papier, Bindung, Prägung, Auflage und Produktionszeit. Eine 80-seitige Schwarz-Weiß-Arbeit mit Spiralbindung kostet deutlich weniger als zwei Hardcover-Exemplare mit farbigen Seiten und Prägung.",
    "## Die wichtigsten Preisfaktoren",
    "- Seitenanzahl pro Exemplar\n- Auflage, also die Anzahl fertiger Exemplare\n- Schwarz-Weiß, Farbe oder Farbe/SW laut PDF\n- Einseitig oder beidseitig\n- Innenpapier, Deckblatt, Bindung und optionale Prägung",
    "## Warum PDF-Upload besser ist als Schätzen",
    "Bei Abschlussarbeiten zählt die echte Datei. Der Konfigurator kann die Seitenanzahl aus der PDF übernehmen und die Auflage sauber berechnen. Aus 100 Seiten und 2 Exemplaren werden 200 Druckseiten; bei Duplex werden daraus 50 Blatt pro Exemplar und 100 Blatt gesamt.",
    "## Typische Preisentscheidung",
    "Wenn der Preis niedrig bleiben soll, wähle Schwarz-Weiß, beidseitigen Druck und eine einfache Bindung. Für die finale Abgabe ist Hardcover mit Prägung teurer, wirkt aber deutlich hochwertiger. Der Konfigurator zeigt dir den aktuellen Preis mit deinen echten Angaben."
  ].join("\n\n"),
  "last-minute-abschlussarbeit-drucken": [
    "Bei einer Last-Minute-Abgabe ist nicht die schönste Option zuerst wichtig, sondern ein stabiler Ablauf: fertige PDF, klare Auswahl, schnelle Produktion und sichere Abholung. Je weniger Sonderwünsche kurz vor der Deadline offen sind, desto besser.",
    "## So bereitest du die Datei vor",
    "- Exportiere eine finale PDF, nicht mehrere Einzeldateien.\n- Prüfe Seitenränder, Seitenreihenfolge und leere Seiten.\n- Benenne die Datei eindeutig, zum Beispiel bachelorarbeit-max-mustermann.pdf.\n- Kläre vorher, ob Hardcover, Klebebindung oder Spiralbindung verlangt wird.",
    "## Was geht schnell?",
    "Skripten und einfache Spiralbindungen sind normalerweise schneller umzusetzen als aufwendige Hardcover mit Prägung. Wenn du eine Prägung brauchst, sollten Titel, Name und Jahr vor dem Absenden final sein.",
    "## Preis und Abholung",
    "Nutze den Produktkonfigurator, lade die PDF hoch und wähle die gewünschte Produktionszeit. Danach kannst du entscheiden, ob Abholung in Wels oder Versand besser zu deiner Deadline passt."
  ].join("\n\n"),
  "abschlussarbeit-wels-drucken-binden": [
    "Wenn du deine Abschlussarbeit in Wels drucken und binden möchtest, ist der kürzeste Weg: PDF hochladen, Ausstattung wählen, Preis sehen und Abholung oder Versand auswählen. Das passt besonders für Studierende rund um Wels und Oberösterreich.",
    "## Für welche Arbeiten?",
    "Bachelorarbeiten, Masterarbeiten, Diplomarbeiten, Dissertationen, Seminararbeiten und Projektarbeiten können über den bestehenden Konfigurator vorbereitet werden. Wichtig ist, dass deine PDF vollständig und druckfertig ist.",
    "## Optionen für die Abgabe",
    "Je nach Vorgabe deiner Hochschule kommen Hardcover, Klebebindung oder Spiralbindung infrage. Für offizielle Abschlussarbeiten ist Hardcover mit Gold- oder Silberprägung oft die hochwertigste Lösung.",
    "## Lokal bestellen",
    "Die Bestellung läuft online, die Datei wird digital übermittelt und die fertige Arbeit kann in Wels abgeholt oder geliefert werden. So musst du nicht mit offenen Druckdaten vor Ort beginnen."
  ].join("\n\n"),
  "studenten-copyshop-wels": [
    "Ein Studenten-Copyshop in Wels sollte mehr können als einzelne Seiten kopieren. Für Studium und Abgabe brauchst du PDF-Upload, saubere Druckqualität, Bindungen, Posterformate und eine klare Preisberechnung vor der Bestellung.",
    "## Typische Aufträge von Studierenden",
    "- Bachelorarbeit, Masterarbeit oder Diplomarbeit drucken und binden\n- Skripten und Lernunterlagen als Spiralbindung\n- Wissenschaftsposter für Präsentationen\n- Seminar- und Projektarbeiten mit mehreren Exemplaren",
    "## Warum online konfigurieren?",
    "Du siehst vorab, welche Angaben gebraucht werden: Seitenanzahl, Auflage, Druckart, Papier und Bindung. Wenn du die PDF hochlädst, kann die Seitenanzahl direkt für die Kalkulation verwendet werden.",
    "## Abholung in Wels",
    "Für Studierende in Wels ist Abholung praktisch, wenn die Abgabe naht oder Versand zeitlich knapp wird. Der Auftrag wird online vorbereitet, damit vor Ort keine wichtigen Details fehlen."
  ].join("\n\n"),
  "spiralbindung-oder-klebebindung": [
    "Spiralbindung und Klebebindung lösen unterschiedliche Probleme. Spiralbindung ist praktisch, liegt flach am Tisch und eignet sich gut für Skripten. Klebebindung wirkt ruhiger und buchähnlicher, ist aber weniger flexibel beim Aufschlagen.",
    "## Spiralbindung",
    "Wähle Spiralbindung für Lernunterlagen, Seminarunterlagen, Arbeitsversionen und Dokumente, die häufig offen am Tisch liegen sollen. Sie ist funktional und gut für Unterlagen, die aktiv genutzt werden.",
    "## Klebebindung",
    "Klebebindung passt besser, wenn die Arbeit geschlossener und professioneller wirken soll. Für manche Abschlussarbeiten ist sie eine gute Zwischenlösung zwischen Spiralbindung und Hardcover.",
    "## Entscheidung",
    "Wenn deine Hochschule eine bestimmte Bindung vorschreibt, folge dieser Vorgabe. Wenn nicht: praktische Nutzung spricht für Spiralbindung, repräsentative Abgabe eher für Klebebindung oder Hardcover."
  ].join("\n\n"),
  "hardcover-oder-softcover": [
    "Hardcover und Softcover unterscheiden sich vor allem in Wirkung, Stabilität und Preis. Für eine finale Abschlussarbeit wirkt Hardcover deutlich hochwertiger, Softcover bleibt leichter und schlichter.",
    "## Wann Hardcover sinnvoll ist",
    "Hardcover eignet sich für Bachelorarbeiten, Masterarbeiten, Diplomarbeiten und Dissertationen, wenn die Arbeit dauerhaft und hochwertig wirken soll. Mit Gold- oder Silberprägung bekommt der Einband einen professionellen Abschluss.",
    "## Wann Softcover reicht",
    "Softcover kann für interne Abgaben, Seminararbeiten oder zusätzliche Exemplare ausreichen. Prüfe aber immer, ob deine Hochschule eine bestimmte Bindung verlangt.",
    "## Preis realistisch berechnen",
    "Die Bindung ist nur ein Teil des Preises. Seitenanzahl, Farbdruck, Papier und Auflage sind ebenso wichtig. Lade deine PDF im Konfigurator hoch, damit die Berechnung auf deiner echten Datei basiert."
  ].join("\n\n"),
  "pdf-fuer-druck-vorbereiten": [
    "Eine gute Druck-PDF verhindert viele Probleme: falsche Seitenreihenfolge, fehlende Schriften, unscharfe Bilder oder abgeschnittene Ränder. Vor der Bestellung sollte die PDF final sein.",
    "## Checkliste für deine PDF",
    "- Als PDF exportieren, nicht als Word-Datei hochladen.\n- Seitenformat prüfen, meistens A4 bei Abschlussarbeiten.\n- Bilder nicht unnötig komprimieren.\n- Seitenzahlen, Inhaltsverzeichnis und Anhänge kontrollieren.\n- Keine Kommentare oder Markierungen im finalen Dokument lassen.",
    "## Seitenanzahl und Druckart",
    "Der PDF-Upload kann die Seitenanzahl für die Konfiguration übernehmen. Danach entscheidest du, ob alles Schwarz-Weiß, alles Farbe oder Farbe/SW laut PDF gedruckt werden soll.",
    "## Vor der Abgabe",
    "Öffne die PDF einmal komplett durch und prüfe die letzten Seiten besonders genau. Viele Fehler entstehen im Anhang, bei leeren Seiten oder bei falsch exportierten Tabellen."
  ].join("\n\n")
};

function fallbackArticleBody(title: string, category: string) {
  const topic = category === "Poster"
    ? "Format, Lesbarkeit, Diagramme und Papierauswahl"
    : category === "Druckvorbereitung"
      ? "PDF-Export, Seitenformat, Farbe und technische Druckdaten"
      : category === "Bindungen"
        ? "Bindungsart, Umfang, Nutzung und Vorgaben der Hochschule"
        : "PDF, Seitenanzahl, Auflage, Papier und Bindung";

  return [
    `${title} beginnt mit einer klaren Entscheidung: Was verlangt die Abgabe und wie wird das fertige Dokument tatsächlich genutzt? Für Studierende ist wichtig, nicht alle Optionen gleichzeitig zu vergleichen, sondern zuerst Datei, Umfang und Ziel der Arbeit zu klären.`,
    "## Worauf du achten solltest",
    `Bei diesem Thema stehen vor allem ${topic} im Vordergrund. Prüfe zuerst die Vorgaben deiner Hochschule und entscheide danach, welche Ausstattung wirklich nötig ist.`,
    "## Von der PDF zum Auftrag",
    "Lade deine finale PDF erst hoch, wenn Seitenreihenfolge, Anhänge und leere Seiten geprüft sind. Danach lassen sich Seitenanzahl, Druckart, Auflage und Bindung deutlich zuverlässiger kalkulieren.",
    "## Nächster sinnvoller Schritt",
    "Wenn du bereits eine fertige Datei hast, nutze den passenden Produktkonfigurator. Dort wird aus der echten Seitenanzahl, der Auflage und den gewählten Optionen ein konkreter Druckauftrag."
  ].join("\n\n");
}

function getStarterBody(slug: string, title: string, category: string) {
  return articleBodies[slug] ?? fallbackArticleBody(title, category);
}

export function getStudentArticleProfile(article: Pick<StudentArticle, "slug" | "category" | "tags" | "relatedProducts">): StudentArticleProfile {
  const tagIntent = article.tags.find((tag) => tag.startsWith("intent:"))?.replace("intent:", "") as StudentArticleSearchIntent | undefined;
  const tagKeyword = article.tags.find((tag) => tag.startsWith("keyword:"))?.replace("keyword:", "");
  const tagGoal = article.tags.find((tag) => tag.startsWith("goal:"))?.replace("goal:", "");
  const tagCta = article.tags.find((tag) => tag.startsWith("cta:"))?.replace("cta:", "");
  const tagCluster = article.tags.find((tag) => tag.startsWith("cluster:"))?.replace("cluster:", "");
  const configured = articleProfiles[article.slug];
  const categoryCluster = studentArticleTopicClusters.find((cluster) => cluster.categories.includes(article.category))?.title ?? "Abschlussarbeiten";

  return {
    searchIntent: tagIntent && ["informational", "commercial", "transactional", "local"].includes(tagIntent) ? tagIntent : configured?.searchIntent ?? "informational",
    primaryKeyword: tagKeyword || configured?.primaryKeyword || article.category,
    secondaryKeywords: configured?.secondaryKeywords ?? [],
    targetProductSlug: article.relatedProducts[0] || configured?.targetProductSlug || "abschlussarbeiten",
    conversionGoal: tagGoal || configured?.conversionGoal || "Passenden Druckauftrag konfigurieren",
    ctaLabel: tagCta || configured?.ctaLabel || "Produkt konfigurieren",
    topicCluster: tagCluster || configured?.topicCluster || categoryCluster
  };
}

function relatedProductsFor(slug: string, category: string) {
  const target = articleProfiles[slug]?.targetProductSlug;
  if (target === "plakate") return ["plakate", "abschlussarbeiten"];
  if (target === "spiralbindung") return ["spiralbindung", "abschlussarbeiten"];
  if (category === "Poster") return ["plakate", "abschlussarbeiten"];
  if (category === "Skripten") return ["spiralbindung", "abschlussarbeiten"];
  return ["abschlussarbeiten", "spiralbindung"];
}

function relatedArticlesFor(slug: string, category: string) {
  const byIntent: Record<string, string[]> = {
    "kosten-bachelorarbeit-drucken": ["bachelorarbeit-drucken-und-binden", "spiralbindung-oder-klebebindung", "einseitig-oder-doppelseitig"],
    "last-minute-abschlussarbeit-drucken": ["pdf-fuer-druck-vorbereiten", "checkliste-vor-abgabe-bachelorarbeit", "abschlussarbeit-wels-drucken-binden"],
    "studenten-copyshop-wels": ["abschlussarbeit-wels-drucken-binden", "skripten-guenstig-drucken-binden", "wissenschaftsposter-richtig-gestalten"],
    "spiralbindung-oder-klebebindung": ["welche-bindung-bachelorarbeit", "hardcover-oder-softcover", "skripten-guenstig-drucken-binden"],
    "pdf-fuer-druck-vorbereiten": ["beschnitt-seitenformat-seitenraender", "rgb-oder-cmyk-abschlussarbeiten", "bilder-abschlussarbeit-aufloesung"]
  };
  return byIntent[slug] ?? starterTopics
    .filter(([relatedSlug, , relatedCategory]) => relatedSlug !== slug && relatedCategory === category)
    .slice(0, 3)
    .map(([relatedSlug]) => relatedSlug);
}

function faqsFor(slug: string) {
  const faqs: Record<string, StudentArticle["faqs"]> = {
    "kosten-bachelorarbeit-drucken": [
      { question: "Was kostet das Drucken einer Bachelorarbeit?", answer: "Der Preis hängt von Seitenanzahl, Auflage, Druckart, Papier, Bindung und Prägung ab. Am genauesten ist die Berechnung mit hochgeladener PDF im Produktkonfigurator." },
      { question: "Ist Schwarz-Weiß deutlich günstiger als Farbe?", answer: "Ja, reine Schwarz-Weiß-Seiten sind in der Regel günstiger. Wenn nur einzelne Diagramme farbig sind, ist Farbe/SW laut PDF meist sinnvoller als alles in Farbe." },
      { question: "Zählt die Auflage bei allen Exemplaren?", answer: "Ja. Bei 80 Seiten und 2 Exemplaren werden 160 Druckseiten produziert. Bindung und Prägung fallen ebenfalls pro physischem Exemplar an." }
    ],
    "last-minute-abschlussarbeit-drucken": [
      { question: "Kann ich eine Abschlussarbeit kurzfristig drucken lassen?", answer: "Das hängt von Umfang, Bindung, Prägung und aktueller Auslastung ab. Eine fertige PDF und klare Konfiguration sparen am meisten Zeit." },
      { question: "Welche Bindung geht am schnellsten?", answer: "Einfache Spiralbindungen sind meist schneller als aufwendige Hardcover mit Prägung. Die passende Option hängt aber von den Vorgaben deiner Hochschule ab." }
    ],
    "studenten-copyshop-wels": [
      { question: "Kann ich als Student in Wels online bestellen?", answer: "Ja. Du kannst PDF, Produkt, Bindung und Auflage online konfigurieren und danach Abholung in Wels oder Versand wählen." },
      { question: "Welche Studentenprodukte sind typisch?", answer: "Häufig sind Abschlussarbeiten, Skripten, Lernunterlagen, Seminararbeiten und Wissenschaftsposter." }
    ],
    "pdf-fuer-druck-vorbereiten": [
      { question: "Soll ich Word oder PDF hochladen?", answer: "Für den Druck ist eine finale PDF am zuverlässigsten, weil Layout, Schriften und Seitenreihenfolge stabil bleiben." },
      { question: "Kann die Seitenanzahl automatisch erkannt werden?", answer: "Ja, der bestehende PDF-Upload kann die Seitenanzahl für konfigurierte Produkte übernehmen." }
    ]
  };
  return faqs[slug] ?? [
    { question: "Kann ich meine PDF-Datei online hochladen?", answer: "Ja, die Produktkonfiguration nutzt den bestehenden Datei-Upload für Druckdaten." },
    { question: "Kann ich in Wels abholen?", answer: "Ja, Abholung in Wels ist im bestehenden Checkout als Lieferoption vorgesehen." }
  ];
}

const starterArticles: StudentArticle[] = starterTopics.map(([slug, title, category, featured], index) => ({
  slug,
  title,
  category,
  featured,
  sortOrder: (index + 1) * 10,
  status: "published",
  publishDate: "2026-08-11T00:00:00.000Z",
  excerpt: articleProfiles[slug]?.searchIntent === "local"
    ? `${title}: Druck, Bindung, PDF-Upload und Abholung für Studierende in Wels und Oberösterreich.`
    : `${title}: klare Entscheidungshilfe für PDF, Seitenanzahl, Bindung, Preis und Abgabe.`,
  body: getStarterBody(slug, title, category),
  featuredImage: "/uploads/products/abschlussarbeiten.webp",
  seoTitle: articleProfiles[slug]?.primaryKeyword
    ? `${articleProfiles[slug].primaryKeyword} | Ratgeber Wels`
    : `${title} | Druck & Design Studio Wels`,
  metaDescription: articleProfiles[slug]?.searchIntent === "commercial" || articleProfiles[slug]?.searchIntent === "transactional"
    ? `Praktischer Ratgeber zu ${articleProfiles[slug].primaryKeyword}: Optionen, Preisfaktoren, PDF-Upload und passende Konfiguration für Studierende.`
    : `Praktische Tipps zu ${title.toLowerCase()} für Studierende in Österreich. Druck, Bindung und PDF-Vorbereitung in Wels.`,
  canonicalUrl: "",
  tags: [
    category,
    "Studenten",
    "Wels",
    `intent:${articleProfiles[slug]?.searchIntent ?? "informational"}`,
    `cluster:${articleProfiles[slug]?.topicCluster ?? category}`
  ],
  relatedProducts: relatedProductsFor(slug, category),
  relatedArticles: relatedArticlesFor(slug, category),
  faqs: faqsFor(slug)
}));

function isGeneratedStarterArticle(row: { body: string; metaDescription: string | null }) {
  return row.body.startsWith("Dieser Ratgeber hilft dir,") || Boolean(row.metaDescription?.startsWith("Praktische Tipps zu "));
}

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
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const count = await prisma.studentArticle.count();
  if (count > 0) {
    const rows = await prisma.studentArticle.findMany({
      where: { slug: { in: starterArticles.map((article) => article.slug) } },
      select: { slug: true, body: true, metaDescription: true }
    });
    const weakSlugs = new Set(rows.filter(isGeneratedStarterArticle).map((row) => row.slug));
    for (const article of starterArticles.filter((item) => weakSlugs.has(item.slug))) {
      await upsertStudentArticle(article);
    }
    return;
  }
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
