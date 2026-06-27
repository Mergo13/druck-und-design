import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StorefrontGate } from "@/components/layout/storefront-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MarketingTracking } from "@/components/analytics/marketing-tracking";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: { default: "druck&design studio | Moderne Online-Druckerei", template: "%s | druck&design studio" },
  description: "Premium Web-to-Print Plattform für Flyer, Visitenkarten, Broschüren, Textildruck, Aufkleber und Werbetechnik.",
  metadataBase: new URL("https://print.dud-studio.local"),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={manrope.className}>
        <GoogleAnalytics />
        <MarketingTracking />
        <StorefrontGate>
          <Header />
          <main className="min-h-[calc(100vh-9rem)]">{children}</main>
          <Footer />
        </StorefrontGate>
      </body>
    </html>
  );
}
