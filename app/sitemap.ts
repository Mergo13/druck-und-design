import type { MetadataRoute } from "next";
import { posts } from "@/data/products";
import { getCategories, getProducts } from "@/lib/catalog-repository";
import { localSeoPages, siteUrl } from "@/lib/seo";
import { getStudentArticles, studentLandingPages } from "@/lib/student-content";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || siteUrl).replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    "/",
    "/leistungen",
    "/news",
    "/studenten",
    "/studenten/ratgeber",
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
    "/ueber-uns",
    "/llms.txt"
  ];

  const [categories, products, studentArticles] = await Promise.all([
    getCategories(),
    getProducts(),
    getStudentArticles()
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
    ...localSeoPages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82
    })),
    ...studentLandingPages.map((page) => ({
      url: `${baseUrl}/studenten/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.72
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
    })),
    ...studentArticles.map((article) => ({
      url: `${baseUrl}/studenten/ratgeber/${article.slug}`,
      lastModified: article.updatedAt ? new Date(article.updatedAt) : now,
      changeFrequency: "monthly" as const,
      priority: article.featured ? 0.72 : 0.62
    }))
  ];

  return entries;
}
