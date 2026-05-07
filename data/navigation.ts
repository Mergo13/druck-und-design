import type { NavItem } from "@/types";

export const navigationItems: NavItem[] = [
  { label: "Druckprodukte", href: "/shop", featured: true },
  { label: "Werbetechnik", href: "/werbetechnik" },
  { label: "Kleidung & Textilien", href: "/textildruck" },
  { label: "Aufkleber", href: "/aufkleber" },
  { label: "Digitales Marketing", href: "/shop?kategorie=digitales-marketing" },
  { label: "Same Day", href: "/shop?kategorie=same-day" },
  { label: "Direct Mailings", href: "/shop?kategorie=direct-mailings" },
  { label: "News", href: "/news" },
  { label: "Kontakt", href: "/kontakt" }
];
