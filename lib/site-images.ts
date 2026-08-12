import { promises as fs } from "fs";
import path from "path";

export type SiteImageSlot = {
  key: string;
  label: string;
  defaultUrl: string;
  group: string;
  pageHref?: string;
  usage?: string;
};

const coreSiteImageSlots: SiteImageSlot[] = [
  { key: "brand.logo", label: "Logo Header/Footer", group: "Brand", pageHref: "/", usage: "Header und Footer", defaultUrl: "/brand/logo-dud.png" },
  { key: "home.hero.1", label: "Startseite Hero 1", group: "Startseite", pageHref: "/", usage: "Hero Slideshow", defaultUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.hero.2", label: "Startseite Hero 2", group: "Startseite", pageHref: "/", usage: "Hero Slideshow", defaultUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.hero.3", label: "Startseite Hero 3", group: "Startseite", pageHref: "/", usage: "Hero Slideshow", defaultUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.service.druckservice", label: "Startseite Druckservice", group: "Startseite", pageHref: "/", usage: "Service-Kachel", defaultUrl: "/uploads/drucken.jpg" },
  { key: "home.service.werbeagentur", label: "Startseite Werbeagentur", group: "Startseite", pageHref: "/", usage: "Service-Kachel", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "home.service.werbetechnik", label: "Startseite Werbetechnik", group: "Startseite", pageHref: "/", usage: "Service-Kachel", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "home.service.textildruck", label: "Startseite Textildruck", group: "Startseite", pageHref: "/", usage: "Service-Kachel", defaultUrl: "/brand/images/tshirt.jpeg" },
  { key: "home.student-shop", label: "Startseite Studenten Shop", group: "Startseite", pageHref: "/", usage: "Studenten-Shop Abschnitt", defaultUrl: "/uploads/drucken.jpg" },
  { key: "druckservice.portfolio.1", label: "Druckservice Bild 1", group: "Druckservice", pageHref: "/druckservice", usage: "Portfolio", defaultUrl: "/uploads/drucken.jpg" },
  { key: "druckservice.portfolio.2", label: "Druckservice Bild 2", group: "Druckservice", pageHref: "/druckservice", usage: "Portfolio", defaultUrl: "/uploads/drucken2.jpg" },
  { key: "druckservice.portfolio.3", label: "Druckservice Bild 3", group: "Druckservice", pageHref: "/druckservice", usage: "Portfolio", defaultUrl: "/uploads/drucken3.jpg" },
  { key: "werbetechnik.hero", label: "Werbetechnik Hero", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Hero", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.visual.1", label: "Werbetechnik Bereich 1", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Leistungsbereich", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.visual.2", label: "Werbetechnik Bereich 2", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Leistungsbereich", defaultUrl: "/uploads/werbetechnik2.jpg" },
  { key: "werbetechnik.visual.3", label: "Werbetechnik Bereich 3", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Leistungsbereich", defaultUrl: "/uploads/werbetechnik3.jpg" },
  { key: "werbetechnik.project.1", label: "Werbetechnik Projekt 1", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Projektkarte", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.project.2", label: "Werbetechnik Projekt 2", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Projektkarte", defaultUrl: "/uploads/werbetechnik2.jpg" },
  { key: "werbetechnik.project.3", label: "Werbetechnik Projekt 3", group: "Werbetechnik", pageHref: "/werbetechnik", usage: "Projektkarte", defaultUrl: "/uploads/werbetechnik3.jpg" },
  { key: "werbeagentur.hero", label: "Werbeagentur Hero", group: "Werbeagentur", pageHref: "/werbeagentur", usage: "Hero", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "werbeagentur.story", label: "Werbeagentur Story", group: "Werbeagentur", pageHref: "/werbeagentur", usage: "Story Abschnitt", defaultUrl: "/uploads/werbeagentur2.jpg" },
  { key: "werbeagentur.visual.1", label: "Werbeagentur Bereich 1", group: "Werbeagentur", pageHref: "/werbeagentur", usage: "Leistungsbereich", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "werbeagentur.visual.2", label: "Werbeagentur Bereich 2", group: "Werbeagentur", pageHref: "/werbeagentur", usage: "Leistungsbereich", defaultUrl: "/uploads/werbeagentur2.jpg" },
  { key: "werbeagentur.visual.3", label: "Werbeagentur Bereich 3", group: "Werbeagentur", pageHref: "/werbeagentur", usage: "Leistungsbereich", defaultUrl: "/uploads/werbeagentur3.jpg" }
];

const industryImageDefaults = [
  { slug: "bau-handwerk", name: "Bau & Handwerk", hero: "/uploads/werbetechnik.jpg", showroom: ["/uploads/werbetechnik.jpg", "/uploads/werbetechnik2.jpg", "/brand/images/textil/Polo1.jpg"] },
  { slug: "architektur-planung", name: "Architektur & Planung", hero: "/uploads/drucken.jpg", showroom: ["/uploads/drucken.jpg", "/demo/broschuere.svg"] },
  { slug: "gastronomie-hotellerie", name: "Gastronomie & Hotellerie", hero: "/uploads/werbeagentur.jpg", showroom: ["/uploads/werbeagentur.jpg", "/uploads/werbetechnik3.jpg", "/brand/images/textil/Polo2.jpg"] },
  { slug: "aerzte-praxen", name: "Ärzte & Praxen", hero: "/uploads/werbetechnik2.jpg", showroom: ["/uploads/werbetechnik2.jpg", "/uploads/drucken2.jpg"] },
  { slug: "einzelhandel", name: "Einzelhandel", hero: "/uploads/werbetechnik3.jpg", showroom: ["/uploads/werbetechnik3.jpg", "/uploads/drucken3.jpg"] },
  { slug: "industrie-produktion", name: "Industrie & Produktion", hero: "/uploads/werbetechnik.jpg", showroom: ["/uploads/werbetechnik.jpg", "/uploads/products/1779214995978-m428ru17.png"] },
  { slug: "immobilien", name: "Immobilien", hero: "/uploads/drucken2.jpg", showroom: ["/uploads/drucken2.jpg"] },
  { slug: "vereine-sport", name: "Vereine & Sport", hero: "/brand/images/tshirt11.jpeg", showroom: ["/brand/images/tshirt11.jpeg"] },
  { slug: "events", name: "Events", hero: "/uploads/drucken3.jpg", showroom: ["/uploads/drucken3.jpg"] },
  { slug: "kunst-kreativ", name: "Kunst & Kreativ", hero: "/uploads/werbeagentur2.jpg", showroom: ["/uploads/werbeagentur2.jpg"] },
  { slug: "unternehmen-bueros", name: "Unternehmen & Büros", hero: "/uploads/drucken.jpg", showroom: ["/uploads/drucken.jpg"] },
  { slug: "beauty-kosmetik", name: "Beauty & Kosmetik", hero: "/uploads/werbeagentur3.jpg", showroom: ["/uploads/werbeagentur3.jpg"] },
  { slug: "auto-mobilitaet", name: "Auto & Mobilität", hero: "/uploads/werbetechnik.jpg", showroom: ["/uploads/werbetechnik.jpg"] },
  { slug: "schulen-bildung", name: "Schulen & Bildung", hero: "/uploads/products/abschlussarbeiten.webp", showroom: ["/uploads/products/abschlussarbeiten.webp"] },
  { slug: "start-ups", name: "Start-ups", hero: "/uploads/werbeagentur.jpg", showroom: ["/uploads/werbeagentur.jpg"] }
];

const categoryShowroomDefaults = [
  { slug: "kleidung-textilien", name: "Textildruck", images: ["/brand/images/tshirt11.jpeg", "/uploads/products/1780495543782-ji4hr4cj.jpg", "/brand/images/textil/Polo1.jpg"] },
  { slug: "textildruck", name: "Textildruck", images: ["/brand/images/tshirt11.jpeg", "/uploads/products/1780495543782-ji4hr4cj.jpg", "/brand/images/textil/Polo2.jpg"] },
  { slug: "fahrzeugbeschriftung", name: "Fahrzeugbeschriftung", images: ["/uploads/werbetechnik.jpg", "/uploads/werbetechnik2.jpg", "/uploads/werbetechnik3.jpg"] },
  { slug: "schilder", name: "Schilder", images: ["/uploads/werbetechnik2.jpg", "/uploads/werbetechnik3.jpg", "/uploads/werbetechnik.jpg"] },
  { slug: "fensterfolie", name: "Fensterfolie", images: ["/uploads/werbetechnik3.jpg", "/uploads/werbeagentur.jpg", "/uploads/drucken.jpg"] },
  { slug: "speisekarten", name: "Speisekarten", images: ["/uploads/werbeagentur.jpg", "/uploads/werbeagentur2.jpg", "/uploads/werbeagentur3.jpg"] }
];

const industrySiteImageSlots: SiteImageSlot[] = industryImageDefaults.flatMap((industry) => [
  {
    key: `industry.${industry.slug}.hero`,
    label: `${industry.name} Hero`,
    group: "Branchen",
    pageHref: `/branchen/${industry.slug}`,
    usage: "Branchen-Hero und Branchenkarten",
    defaultUrl: industry.hero
  },
  ...industry.showroom.map((image, index) => ({
    key: `industry.${industry.slug}.showroom.${index + 1}`,
    label: `${industry.name} Showroom ${index + 1}`,
    group: "Branchen",
    pageHref: `/branchen/${industry.slug}`,
    usage: "Branchen-Showroom",
    defaultUrl: image
  }))
]);

const categoryShowroomSiteImageSlots: SiteImageSlot[] = categoryShowroomDefaults.flatMap((category) =>
  category.images.map((image, index) => ({
    key: `category.${category.slug}.showroom.${index + 1}`,
    label: `${category.name} Showroom ${index + 1}`,
    group: "Kategorie Showrooms",
    pageHref: `/${category.slug}`,
    usage: "Kategorie-Showroom",
    defaultUrl: image
  }))
);

export const siteImageSlots: SiteImageSlot[] = [
  ...coreSiteImageSlots,
  ...industrySiteImageSlots,
  ...categoryShowroomSiteImageSlots
];

const siteImagesPath = path.join(process.cwd(), "data", "site-images.json");

function isSafeImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\0") && !trimmed.includes("..");
}

export async function getSiteImageMap() {
  const defaults = Object.fromEntries(siteImageSlots.map((slot) => [slot.key, slot.defaultUrl]));
  const raw = await fs.readFile(siteImagesPath, "utf8").catch(() => "{}");
  try {
    const saved = JSON.parse(raw) as Record<string, string>;
    return { ...defaults, ...Object.fromEntries(Object.entries(saved).filter(([, value]) => isSafeImageUrl(value))) };
  } catch {
    return defaults;
  }
}

export async function getSiteImage(key: string) {
  const images = await getSiteImageMap();
  return images[key] ?? siteImageSlots.find((slot) => slot.key === key)?.defaultUrl ?? "";
}

export async function saveSiteImageMap(values: Record<string, string>) {
  const allowedKeys = new Set(siteImageSlots.map((slot) => slot.key));
  const next = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => allowedKeys.has(key) && isSafeImageUrl(value))
  );
  await fs.mkdir(path.dirname(siteImagesPath), { recursive: true });
  await fs.writeFile(siteImagesPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
