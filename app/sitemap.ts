import type { MetadataRoute } from "next";
import { posts } from "@/data/products";
import { getCategories, getProducts } from "@/lib/catalog-repository";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3010").replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    "/",
    "/leistungen",
    "/news",
    "/kontakt",
    "/faq",
    "/druckservice",
    "/werbetechnik",
    "/kleidung-textilien",
    "/werbeagentur",
    "/versand-lieferung",
    "/lieferung-zahlung",
    "/druckdaten-hinweise",
    "/widerruf",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/ueber-uns"
  ];

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts()
  ]);

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) => {
      const changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = path === "/" ? "daily" : "weekly";
      return {
        url: `${baseUrl}${path}`,
        lastModified: now,
        changeFrequency,
        priority: path === "/" ? 1 : 0.7
      };
    }),
    ...categories
      .filter((category) => category.visible !== false && category.published !== false)
      .map((category) => ({
        url: `${baseUrl}/${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75
      })),
    ...products
      .filter((product) => product.visible !== false && product.published !== false)
      .map((product) => ({
        url: `${baseUrl}/produkt/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
    ...posts.map((post) => ({
      url: `${baseUrl}/news/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.65
    }))
  ];

  return entries;
}
