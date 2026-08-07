import type { Metadata } from "next";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StorefrontGate } from "@/components/layout/storefront-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MarketingTracking } from "@/components/analytics/marketing-tracking";
import { Suspense } from "react";
import { StructuredData } from "@/components/structured-data";
import { companySeo, localBusinessJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Druckerei, Werbetechnik & Werbeagentur in Wels | druck&design studio",
    template: "%s | druck&design studio"
  },
  description: "Druckerei, Werbetechnik, Werbeagentur, Textildruck, Fahrzeugbeschriftung, Fensterfolierung, Schilder, Großformatdruck und Webdesign in Wels und Oberösterreich.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  applicationName: "druck&design studio",
  authors: [{ name: companySeo.name, url: siteUrl }],
  creator: companySeo.name,
  publisher: companySeo.name,
  keywords: [
    "Druckerei Wels",
    "Werbetechnik Wels",
    "Werbeagentur Wels",
    "Textildruck Wels",
    "Fahrzeugbeschriftung Wels",
    "Fensterfolierung Wels",
    "Schilder Wels",
    "Großformatdruck Wels",
    "Visitenkarten Wels",
    "Flyer drucken Wels",
    "Copyshop Wels",
    "Webdesign Wels",
    "Druckerei Linz",
    "Werbetechnik Linz",
    "Druckerei Eferding",
    "Druckerei Wels-Land",
    "Druckerei Linz-Land"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: "Druckerei, Werbetechnik & Werbeagentur in Wels",
    description: "Design, Digitaldruck, Großformat, Beschriftung, Textildruck und Webdesign aus Wels.",
    url: siteUrl,
    siteName: "druck&design studio",
    locale: "de_AT",
    type: "website",
    images: [{ url: "/brand/logo-dud.png", width: 1200, height: 630, alt: "druck&design studio" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Druckerei, Werbetechnik & Werbeagentur in Wels",
    description: "Druck, Werbetechnik, Textildruck und Webdesign aus Wels."
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <StructuredData data={localBusinessJsonLd()} />
        <Suspense>
          <GoogleAnalytics />
          <MarketingTracking />
        </Suspense>
        <StorefrontGate>
          <Header />
          <main className="min-h-[calc(100vh-9rem)]">{children}</main>
          <Footer />
        </StorefrontGate>
      </body>
    </html>
  );
}
