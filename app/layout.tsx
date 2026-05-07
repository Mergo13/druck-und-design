import type { Metadata } from "next";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: { default: "DUD Studio Print | Moderne Online-Druckerei", template: "%s | DUD Studio Print" },
  description: "Premium Web-to-Print Plattform für Flyer, Visitenkarten, Broschüren, Textildruck, Aufkleber und Werbetechnik.",
  metadataBase: new URL("https://print.dud-studio.local")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
