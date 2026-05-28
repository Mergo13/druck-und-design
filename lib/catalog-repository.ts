import { promises as fs } from "fs";
import path from "path";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";
import type { Order } from "@/types";

type PlatformDb = {
  categories: ProductCategory[];
  products: ProductCatalogItem[];
  orders: Order[];
  users?: import("@/types").UserAccount[];
};

const dbPath = path.join(process.cwd(), "data", "platform-db.json");

async function readDb(): Promise<PlatformDb> {
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw) as PlatformDb;
}

async function writeDb(next: PlatformDb) {
  await fs.writeFile(dbPath, JSON.stringify(next, null, 2), "utf8");
}

export async function getCategories() {
  const db = await readDb();
  return db.categories;
}

export async function getProducts() {
  const db = await readDb();
  return db.products;
}

export async function getProductBySlug(slug: string) {
  const db = await readDb();
  return db.products.find((item) => item.slug === slug) ?? null;
}

export async function upsertCategory(category: ProductCategory) {
  const db = await readDb();
  const exists = db.categories.some((item) => item.slug === category.slug);
  const categories = exists ? db.categories.map((item) => item.slug === category.slug ? category : item) : [category, ...db.categories];
  await writeDb({ ...db, categories });
  return category;
}

export async function deleteCategory(slug: string) {
  const db = await readDb();
  const categories = db.categories.filter((item) => item.slug !== slug);
  await writeDb({ ...db, categories });
}

export async function upsertProduct(product: ProductCatalogItem) {
  const db = await readDb();
  const exists = db.products.some((item) => item.slug === product.slug);
  const products = exists ? db.products.map((item) => item.slug === product.slug ? product : item) : [product, ...db.products];
  await writeDb({ ...db, products });
  return product;
}

export async function deleteProduct(slug: string) {
  const db = await readDb();
  const products = db.products.filter((item) => item.slug !== slug);
  await writeDb({ ...db, products });
}

export async function getOrders() {
  const db = await readDb();
  return db.orders;
}

export async function saveOrder(order: Order) {
  const db = await readDb();
  const exists = db.orders.some((item) => item.id === order.id);
  const orders = exists ? db.orders.map((item) => item.id === order.id ? order : item) : [order, ...(db.orders || [])];
  await writeDb({ ...db, orders });
  return order;
}

export async function getUsers() {
  const db = await readDb();
  return db.users ?? [];
}

export async function getUserByEmail(email: string) {
  const users = await getUsers();
  return users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function saveUser(user: import("@/types").UserAccount) {
  const db = await readDb();
  const users = db.users ?? [];
  const exists = users.some((item) => item.email.toLowerCase() === user.email.toLowerCase());
  const nextUsers = exists ? users.map((item) => item.email.toLowerCase() === user.email.toLowerCase() ? user : item) : [user, ...users];
  await writeDb({ ...db, users: nextUsers });
  return user;
}

export async function deleteOrder(id: string) {
  const db = await readDb();
  const orders = db.orders.filter((item) => item.id !== id);
  await writeDb({ ...db, orders });
}
