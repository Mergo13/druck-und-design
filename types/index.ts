export type Product = {
  slug: string;
  name: string;
  category: string;
  short: string;
  description: string;
  priceFrom: number;
  rating: number;
  delivery: string;
  tags: string[];
  seo: string;
  image: string;
  gallery: string[];
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: string;
  date: string;
};

export type CartItem = {
  id: string;
  productSlug: string;
  name: string;
  quantity: number;
  price: number;
  config: Record<string, string>;
  mockupUrl?: string;
  preflightPassed?: boolean;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  billingAddress?: string;
  shippingAddress?: string;
  vatId?: string;
  company?: string;
  shippingCost?: number;
  shippingName?: string;
  processingFee?: number;
  couponCode?: string;
  couponDiscount?: number;
};

export type UserAccount = {
  id: string;
  fullName?: string;
  company?: string;
  vatId?: string;
  phone?: string;
  email: string;
  passwordHash: string;
  billingAddress?: string;
  shippingAddress?: string;
  studentVerification?: {
    university?: string;
    status?: "pending" | "approved" | "rejected" | "expired";
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNote?: string;
    validUntil?: string;
    documentPath?: string;
  };
  createdAt: string;
};

export type SessionUser = {
  id: string;
  fullName?: string;
  company?: string;
  vatId?: string;
  phone?: string;
  email: string;
  billingAddress?: string;
  shippingAddress?: string;
};

export type NavItem = {
  label: string;
  href: string;
  featured?: boolean;
};
