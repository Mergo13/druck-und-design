import type { ProductCategory, ShowroomImage } from "@/types/print-platform";

const categoryShowrooms: Record<string, ShowroomImage[]> = {
  "kleidung-textilien": [
    { image: "/brand/images/tshirt11.jpeg", title: "Shirts", description: "Bedruckte Shirts für Teams, Aktionen und Events." },
    { image: "/uploads/products/1780495543782-ji4hr4cj.jpg", title: "Hoodies", description: "Premium Hoodies für Brandwear und Vereine." },
    { image: "/brand/images/textil/Polo1.jpg", title: "Workwear", description: "Arbeitskleidung mit Logo für Service und Montage." }
  ],
  textildruck: [
    { image: "/brand/images/tshirt11.jpeg", title: "Shirts", description: "Bedruckte Shirts für Teams, Aktionen und Events." },
    { image: "/uploads/products/1780495543782-ji4hr4cj.jpg", title: "Hoodies", description: "Premium Hoodies für Brandwear und Vereine." },
    { image: "/brand/images/textil/Polo2.jpg", title: "Workwear", description: "Arbeitskleidung mit Logo für Service und Montage." }
  ],
  fahrzeugbeschriftung: [
    { image: "/uploads/werbetechnik.jpg", title: "PKW", description: "Klare Fahrzeugbeschriftung für tägliche Sichtbarkeit." },
    { image: "/uploads/werbetechnik2.jpg", title: "Transporter", description: "Große Flächen für Handwerk, Service und Lieferung." },
    { image: "/uploads/werbetechnik3.jpg", title: "Flotten", description: "Einheitlicher Auftritt für mehrere Fahrzeuge." }
  ],
  schilder: [
    { image: "/uploads/werbetechnik2.jpg", title: "Firmenschilder", description: "Wetterfeste Schilder für Standort und Empfang." },
    { image: "/uploads/werbetechnik3.jpg", title: "Praxisschilder", description: "Seriöse Orientierung für Praxen und Büros." },
    { image: "/uploads/werbetechnik.jpg", title: "Bauschilder", description: "Projekt- und Baustellenkommunikation im Außenbereich." }
  ],
  fensterfolie: [
    { image: "/uploads/werbetechnik3.jpg", title: "Shops", description: "Aktionen, Öffnungszeiten und Sichtschutz." },
    { image: "/uploads/werbeagentur.jpg", title: "Restaurants", description: "Fensterflächen für Speisekarten, Logos und Hinweise." },
    { image: "/uploads/drucken.jpg", title: "Offices", description: "Sichtschutz und Glasdekor für moderne Büros." }
  ],
  speisekarten: [
    { image: "/uploads/werbeagentur.jpg", title: "Restaurantkarten", description: "Hochwertige Karten für Speisen und Saisonangebote." },
    { image: "/uploads/werbeagentur2.jpg", title: "Café-Karten", description: "Kompakte Karten für Theke, Tisch und Außenbereich." },
    { image: "/uploads/werbeagentur3.jpg", title: "Getränkekarten", description: "Robuste Karten und Specials für Bar und Hotel." }
  ]
};

export function getCategoryShowroom(category: ProductCategory, siteImages: Record<string, string> = {}): ShowroomImage[] {
  if (category.showroomImages?.length) {
    return category.showroomImages.map((item, index) => ({
      ...item,
      image: siteImages[`category.${category.slug}.showroom.${index + 1}`] ?? item.image
    }));
  }
  const directSlug = String(category.slug);
  const direct = categoryShowrooms[directSlug];
  if (direct?.length) return applyManagedCategoryImages(directSlug, direct, siteImages);
  const searchable = `${category.slug} ${category.name}`.toLowerCase();
  if (searchable.includes("textil") || searchable.includes("kleidung")) return applyManagedCategoryImages("textildruck", categoryShowrooms.textildruck, siteImages);
  if (searchable.includes("fahrzeug")) return applyManagedCategoryImages("fahrzeugbeschriftung", categoryShowrooms.fahrzeugbeschriftung, siteImages);
  if (searchable.includes("schild")) return applyManagedCategoryImages("schilder", categoryShowrooms.schilder, siteImages);
  if (searchable.includes("fenster") || searchable.includes("folie")) return applyManagedCategoryImages("fensterfolie", categoryShowrooms.fensterfolie, siteImages);
  if (searchable.includes("speisekarte") || searchable.includes("gastro")) return applyManagedCategoryImages("speisekarten", categoryShowrooms.speisekarten, siteImages);
  return category.logo
    ? [{ image: category.logo, title: category.name, description: category.description }]
    : [];
}

function applyManagedCategoryImages(slug: string, images: ShowroomImage[], siteImages: Record<string, string>) {
  return images.map((item, index) => ({
    ...item,
    image: siteImages[`category.${slug}.showroom.${index + 1}`] ?? item.image
  }));
}
