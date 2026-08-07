import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || siteUrl).replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/konto", "/login", "/registrierung", "/warenkorb", "/checkout"]
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"],
        allow: "/",
        disallow: ["/admin", "/api", "/konto", "/login", "/registrierung", "/warenkorb", "/checkout"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
