import {
  BarChart3,
  BriefcaseBusiness,
  Brush,
  FileText,
  Gauge,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  School,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  Upload,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  icon: LucideIcon;
  items: AdminNavItem[];
};

export const adminNav: Array<AdminNavItem | AdminNavGroup> = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    title: "Verkauf",
    icon: ShoppingCart,
    items: [
      { title: "Bestellungen", href: "/admin/sales/orders", icon: ReceiptText },
      { title: "Angebote", href: "/admin/sales/quotes", icon: FileText },
      { title: "Rechnungen", href: "/admin/sales/invoices", icon: FileText }
    ]
  },
  {
    title: "Katalog",
    icon: Package,
    items: [
      { title: "Produkte", href: "/admin/catalog/products", icon: Package },
      { title: "Kategorien", href: "/admin/catalog/categories", icon: Tags },
      { title: "Eigenschaften / Attribute", href: "/admin/catalog/properties", icon: SlidersHorizontal },
      { title: "Branchen", href: "/admin/catalog/industries", icon: BriefcaseBusiness },
      { title: "Werkzeuge", href: "/admin/catalog/tools", icon: SlidersHorizontal }
    ]
  },
  {
    title: "Kunden & Marketing",
    icon: Users,
    items: [
      { title: "Kunden", href: "/admin/marketing/customers", icon: Users },
      { title: "Gutscheine", href: "/admin/marketing/coupons", icon: Tags },
      { title: "Bewertungen", href: "/admin/marketing/reviews", icon: Megaphone },
      { title: "Newsletter", href: "/admin/marketing/newsletter", icon: Megaphone },
      { title: "Studenten", href: "/admin/marketing/students", icon: School }
    ]
  },
  {
    title: "Inhalte",
    icon: LayoutTemplate,
    items: [
      { title: "Homepage", href: "/admin/content/homepage", icon: LayoutDashboard },
      { title: "Website-Bilder", href: "/admin/content/images", icon: Image },
      { title: "Werbung", href: "/admin/content/advertising", icon: Megaphone },
      { title: "Layout Studio", href: "/admin/content/layouts", icon: Brush }
    ]
  },
  {
    title: "Berichte",
    icon: BarChart3,
    items: [
      { title: "Verkäufe", href: "/admin/reports/sales", icon: BarChart3 },
      { title: "Analysen", href: "/admin/reports/analytics", icon: Gauge }
    ]
  },
  {
    title: "Betrieb",
    icon: Truck,
    items: [
      { title: "Datei-Uploads", href: "/admin/operations/uploads", icon: Upload },
      { title: "Versand", href: "/admin/operations/shipping", icon: Truck },
      { title: "Shop-Steuerung", href: "/admin/operations/store", icon: SlidersHorizontal }
    ]
  },
  { title: "Einstellungen", href: "/admin/settings", icon: Settings }
];

export function isNavGroup(item: AdminNavItem | AdminNavGroup): item is AdminNavGroup {
  return "items" in item;
}

export function adminTitleForPath(pathname: string) {
  for (const item of adminNav) {
    if (isNavGroup(item)) {
      const child = item.items.find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
      if (child) return child.title;
    } else if (pathname === item.href) {
      return item.title;
    }
  }
  return "Admin";
}
