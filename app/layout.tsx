import type { Metadata } from "next";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StorefrontGate } from "@/components/layout/storefront-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MarketingTracking } from "@/components/analytics/marketing-tracking";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { default: "druck&design studio | Online-Druckerei", template: "%s | druck&design studio" },
  description: "Premium Web-to-Print Plattform für Flyer, Visitenkarten, Broschüren, Textildruck, Aufkleber und Werbetechnik.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
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
