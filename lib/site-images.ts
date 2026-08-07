import { promises as fs } from "fs";
import path from "path";

export type SiteImageSlot = {
  key: string;
  label: string;
  defaultUrl: string;
};

export const siteImageSlots: SiteImageSlot[] = [
  { key: "brand.logo", label: "Logo Header/Footer", defaultUrl: "/brand/logo-dud.png" },
  { key: "home.hero.1", label: "Startseite Hero 1", defaultUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.hero.2", label: "Startseite Hero 2", defaultUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.hero.3", label: "Startseite Hero 3", defaultUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2200&q=80" },
  { key: "home.service.druckservice", label: "Startseite Druckservice", defaultUrl: "/uploads/drucken.jpg" },
  { key: "home.service.werbeagentur", label: "Startseite Werbeagentur", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "home.service.werbetechnik", label: "Startseite Werbetechnik", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "home.service.textildruck", label: "Startseite Textildruck", defaultUrl: "/brand/images/tshirt.jpeg" },
  { key: "druckservice.portfolio.1", label: "Druckservice Bild 1", defaultUrl: "/uploads/drucken.jpg" },
  { key: "druckservice.portfolio.2", label: "Druckservice Bild 2", defaultUrl: "/uploads/drucken2.jpg" },
  { key: "druckservice.portfolio.3", label: "Druckservice Bild 3", defaultUrl: "/uploads/drucken3.jpg" },
  { key: "werbetechnik.hero", label: "Werbetechnik Hero", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.visual.1", label: "Werbetechnik Bereich 1", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.visual.2", label: "Werbetechnik Bereich 2", defaultUrl: "/uploads/werbetechnik2.jpg" },
  { key: "werbetechnik.visual.3", label: "Werbetechnik Bereich 3", defaultUrl: "/uploads/werbetechnik3.jpg" },
  { key: "werbetechnik.project.1", label: "Werbetechnik Projekt 1", defaultUrl: "/uploads/werbetechnik.jpg" },
  { key: "werbetechnik.project.2", label: "Werbetechnik Projekt 2", defaultUrl: "/uploads/werbetechnik2.jpg" },
  { key: "werbetechnik.project.3", label: "Werbetechnik Projekt 3", defaultUrl: "/uploads/werbetechnik3.jpg" },
  { key: "werbeagentur.hero", label: "Werbeagentur Hero", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "werbeagentur.story", label: "Werbeagentur Story", defaultUrl: "/uploads/werbeagentur2.jpg" },
  { key: "werbeagentur.visual.1", label: "Werbeagentur Bereich 1", defaultUrl: "/uploads/werbeagentur.jpg" },
  { key: "werbeagentur.visual.2", label: "Werbeagentur Bereich 2", defaultUrl: "/uploads/werbeagentur2.jpg" },
  { key: "werbeagentur.visual.3", label: "Werbeagentur Bereich 3", defaultUrl: "/uploads/werbeagentur3.jpg" }
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
