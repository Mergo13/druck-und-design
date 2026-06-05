import { promises as fs } from "fs";
import path from "path";
import generateRetailData from "data-generator-retail";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";
import type { Order } from "@/types";

type PlatformDb = {
  categories: ProductCategory[];
  products: ProductCatalogItem[];
  orders: Order[];
  users?: import("@/types").UserAccount[];
  clientLogos?: string[];
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

export async function getPublicCategories() {
  const categories = await getCategories();
  return categories.filter((item) => item.visible !== false && item.published !== false);
}

export async function getPublicProducts() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const visibleCategories = new Set(
    categories
      .filter((item) => item.visible !== false && item.published !== false)
      .map((item) => item.slug)
  );
  return products.filter(
    (item) => item.visible !== false && item.published !== false && visibleCategories.has(item.category)
  );
}

export async function getProductBySlug(slug: string) {
  const db = await readDb();
  return db.products.find((item) => item.slug === slug) ?? null;
}

export async function getPublicProductBySlug(slug: string) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const product = products.find((item) => item.slug === slug);
  if (!product || product.visible === false || product.published === false) {
    return null;
  }
  const category = categories.find((item) => item.slug === product.category);
  if (!category || category.visible === false || category.published === false) {
    return null;
  }
  return product;
}

export async function upsertCategory(category: ProductCategory, originalSlug?: string) {
  const db = await readDb();
  const targetSlug = originalSlug ?? category.slug;
  const categoriesWithoutOld = db.categories.filter((item) => item.slug !== targetSlug);
  const categories = [category, ...categoriesWithoutOld];
  const products = targetSlug !== category.slug
    ? db.products.map((item) => item.category === targetSlug ? { ...item, category: category.slug } : item)
    : db.products;
  await writeDb({ ...db, categories, products });
  return category;
}

export async function deleteCategory(slug: string) {
  const db = await readDb();
  const linkedProducts = db.products.filter((item) => item.category === slug);
  if (linkedProducts.length > 0) {
    throw new Error("Kategorie kann nicht gelöscht werden, solange Produkte zugeordnet sind.");
  }
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
  const exists = users.some(
    (item) => item.id === user.id || item.email.toLowerCase() === user.email.toLowerCase()
  );
  const nextUsers = exists
    ? users.map((item) =>
        item.id === user.id || item.email.toLowerCase() === user.email.toLowerCase() ? user : item
      )
    : [user, ...users];
  await writeDb({ ...db, users: nextUsers });
  return user;
}

export async function deleteOrder(id: string) {
  const db = await readDb();
  const orders = db.orders.filter((item) => item.id !== id);
  await writeDb({ ...db, orders });
}

export async function getClientLogos() {
  const db = await readDb();
  return db.clientLogos ?? [];
}

export async function saveClientLogos(logos: string[]) {
  const db = await readDb();
  const clientLogos = logos.filter(Boolean);
  await writeDb({ ...db, clientLogos });
  return clientLogos;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function seedFromReactAdminDataGenerator() {
  const generated = generateRetailData();
  const db = await readDb();

  const categories: ProductCategory[] = generated.categories.map((category) => ({
    slug: toSlug(category.name),
    name: category.name.charAt(0).toUpperCase() + category.name.slice(1),
    description: `Demo category generated from react-admin data-generator: ${category.name}.`,
    visible: true,
    published: true,
    defaultPropertyTemplate: "print-basic",
    quantitySteps: [1, 10, 50, 100, 500, 1000]
  }));

  const categoryIdToSlug = new Map(generated.categories.map((category) => [category.id, toSlug(category.name)]));

  const products: ProductCatalogItem[] = generated.products.map((product) => {
    const categorySlug = categoryIdToSlug.get(product.category_id) ?? "druckprodukte";
    const productSlug = toSlug(`${categorySlug}-${product.reference}-${product.id}`);
    const basePrice = Number(product.price.toFixed(2));

    return {
      slug: productSlug,
      name: product.reference,
      category: categorySlug,
      visible: true,
      published: true,
      short: `${product.reference} - generated demo product.`,
      description: product.description,
      seo: `${product.reference} in category ${categorySlug}. Auto-generated SEO text for demo catalog.`,
      heroImage: product.image,
      gallery: [product.image, product.thumbnail],
      rating: 4.5,
      basePrice,
      deliveryText: product.stock > 0 ? "3-5 Werktage" : "Auf Anfrage",
      tags: ["Demo", categorySlug],
      variants: [
        {
          id: `${productSlug}-default`,
          name: "Default",
          skuPrefix: productSlug.toUpperCase().slice(0, 12),
          attributes: [
            {
              key: "size",
              label: "Size",
              type: "select",
              required: true,
              defaultValue: "standard",
              options: [{ value: "standard", label: `${Math.round(product.width)}x${Math.round(product.height)} cm` }]
            }
          ],
          quantityRule: { min: 1, max: 5000, step: 1 },
          priceRules: [
            { key: "basis", label: "Basispreis", type: "fixed", amount: basePrice },
            { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: Number((basePrice * 0.1).toFixed(2)) }
          ]
        }
      ],
      production: {
        baseProductionDays: 3,
        expressAvailable: product.stock > 0,
        preflightProfile: "standard-print",
        renderPipeline: "pdf-x4"
      },
      quantitySteps: [1, 10, 50, 100, 500, 1000],
      propertyTemplate: "print-basic"
    };
  });

  await writeDb({
    ...db,
    categories,
    products
  });

  return {
    categories: categories.length,
    products: products.length
  };
}
