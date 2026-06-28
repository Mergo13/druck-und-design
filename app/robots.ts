import type { MetadataRoute } from "next";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3010").replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/konto", "/login", "/registrierung", "/warenkorb", "/checkout"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
