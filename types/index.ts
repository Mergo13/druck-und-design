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
};

export type UserAccount = {
  id: string;
  company?: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  company?: string;
  email: string;
};

export type NavItem = {
  label: string;
  href: string;
  featured?: boolean;
};
