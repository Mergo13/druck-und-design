import { promises as fs } from "fs";
import path from "path";
import generateRetailData from "data-generator-retail";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Order, UserAccount } from "@/types";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

type LegacyPlatformDb = {
  categories: ProductCategory[];
  products: ProductCatalogItem[];
  orders: Order[];
  users?: UserAccount[];
  clientLogos?: string[];
};

const legacyDbPath = path.join(process.cwd(), "data", "platform-db.json");
let catalogSeeded = false;

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function readLegacyDb(): Promise<LegacyPlatformDb> {
  const raw = await fs.readFile(legacyDbPath, "utf8");
  return JSON.parse(raw) as LegacyPlatformDb;
}

async function ensureCatalogSeeded() {
  if (catalogSeeded) return;
  const [categoryCount, productCount, userCount] = await Promise.all([
    prisma.catalogCategory.count(),
    prisma.catalogProduct.count(),
    prisma.customerAccount.count()
  ]);
  if (categoryCount > 0 || productCount > 0 || userCount > 0) {
    catalogSeeded = true;
    return;
  }

  const legacy = await readLegacyDb().catch(() => null);
  if (!legacy) {
    catalogSeeded = true;
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const category of legacy.categories ?? []) {
      await tx.catalogCategory.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          slug: category.slug,
          name: category.name,
          visible: category.visible ?? true,
          published: category.published ?? true,
          data: asJson(category)
        }
      });
    }
    for (const product of legacy.products ?? []) {
      await tx.catalogProduct.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: product.visible ?? true,
          published: product.published ?? true,
          data: asJson(product)
        }
      });
    }
    if (process.env.NODE_ENV !== "production") {
      for (const user of legacy.users ?? []) {
        await tx.customerAccount.upsert({
          where: { email: user.email.toLowerCase() },
          update: {},
          create: {
            id: user.id,
            email: user.email.toLowerCase(),
            passwordHash: user.passwordHash,
            data: asJson(user)
          }
        });
      }
    }
    if (legacy.clientLogos?.length) {
      await tx.clientLogoSet.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", logos: asJson(legacy.clientLogos) }
      });
    }
  });
  catalogSeeded = true;
}

function categoryFromRow(row: { data: unknown; slug: string; name: string; visible: boolean; published: boolean }) {
  return {
    ...(row.data as ProductCategory),
    slug: row.slug,
    name: row.name,
    visible: row.visible,
    published: row.published
  };
}

function productFromRow(row: { data: unknown; slug: string; name: string; category: string; visible: boolean; published: boolean }) {
  return {
    ...(row.data as ProductCatalogItem),
    slug: row.slug,
    name: row.name,
    category: row.category,
    visible: row.visible,
    published: row.published
  };
}

export async function getCategories() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogCategory.findMany({ orderBy: { name: "asc" } });
  return rows.map(categoryFromRow);
}

export async function getProducts() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogProduct.findMany({ orderBy: { name: "asc" } });
  return rows.map(productFromRow);
}

export async function getPublicCategories() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogCategory.findMany({
    where: { visible: true, published: true },
    orderBy: { name: "asc" }
  });
  return rows.map(categoryFromRow);
}

export async function getPublicProducts() {
  await ensureCatalogSeeded();
  const visibleCategories = await prisma.catalogCategory.findMany({
    where: { visible: true, published: true },
    select: { slug: true }
  });
  const rows = await prisma.catalogProduct.findMany({
    where: {
      visible: true,
      published: true,
      category: { in: visibleCategories.map((item) => item.slug) }
    },
    orderBy: { name: "asc" }
  });
  return rows.map(productFromRow);
}

export async function getProductBySlug(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogProduct.findUnique({ where: { slug } });
  return row ? productFromRow(row) : null;
}

export async function getPublicProductBySlug(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogProduct.findFirst({
    where: { slug, visible: true, published: true }
  });
  if (!row) return null;
  const category = await prisma.catalogCategory.findFirst({
    where: { slug: row.category, visible: true, published: true }
  });
  return category ? productFromRow(row) : null;
}

export async function upsertCategory(category: ProductCategory, originalSlug?: string) {
  await ensureCatalogSeeded();
  const targetSlug = originalSlug ?? category.slug;
  await prisma.$transaction(async (tx) => {
    if (targetSlug !== category.slug) {
      const linked = await tx.catalogProduct.findMany({ where: { category: targetSlug } });
      for (const row of linked) {
        const data = { ...(row.data as ProductCatalogItem), category: category.slug };
        await tx.catalogProduct.update({
          where: { slug: row.slug },
          data: { category: category.slug, data: asJson(data) }
        });
      }
      await tx.catalogCategory.delete({ where: { slug: targetSlug } });
    }
    await tx.catalogCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        visible: category.visible ?? true,
        published: category.published ?? true,
        data: asJson(category)
      },
      create: {
        slug: category.slug,
        name: category.name,
        visible: category.visible ?? true,
        published: category.published ?? true,
        data: asJson(category)
      }
    });
  });
  return category;
}

export async function deleteCategory(slug: string) {
  await ensureCatalogSeeded();
  const linkedProducts = await prisma.catalogProduct.count({ where: { category: slug } });
  if (linkedProducts > 0) {
    throw new Error("Kategorie kann nicht gelöscht werden, solange Produkte zugeordnet sind.");
  }
  await prisma.catalogCategory.delete({ where: { slug } });
}

export async function upsertProduct(product: ProductCatalogItem) {
  await ensureCatalogSeeded();
  const category = await prisma.catalogCategory.findUnique({ where: { slug: product.category } });
  if (!category) throw new Error("Die gewählte Kategorie existiert nicht.");
  await prisma.catalogProduct.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      category: product.category,
      visible: product.visible ?? true,
      published: product.published ?? true,
      data: asJson(product)
    },
    create: {
      slug: product.slug,
      name: product.name,
      category: product.category,
      visible: product.visible ?? true,
      published: product.published ?? true,
      data: asJson(product)
    }
  });
  return product;
}

export async function deleteProduct(slug: string) {
  await ensureCatalogSeeded();
  await prisma.catalogProduct.delete({ where: { slug } });
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.adminOrder.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    items: row.items as unknown as Order["items"],
    total: row.total,
    company: row.company ?? undefined,
    vatId: row.vatId ?? undefined,
    billingAddress: row.billingAddress ?? undefined,
    shippingAddress: row.shippingAddress ?? undefined,
    shippingCost: row.shippingCost ?? undefined,
    shippingName: row.shippingName ?? undefined,
    processingFee: row.processingFee ?? undefined,
    customerName: row.customer,
    customerEmail: row.email ?? undefined
  }));
}

export async function saveOrder(order: Order) {
  await prisma.adminOrder.upsert({
    where: { id: order.id },
    update: {
      customer: order.customerName || "Kunde",
      email: order.customerEmail,
      company: order.company,
      vatId: order.vatId,
      total: order.total,
      items: asJson(order.items),
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      shippingCost: order.shippingCost,
      shippingName: order.shippingName,
      processingFee: order.processingFee
    },
    create: {
      id: order.id,
      customer: order.customerName || "Kunde",
      email: order.customerEmail,
      company: order.company,
      vatId: order.vatId,
      total: order.total,
      status: "Neu",
      items: asJson(order.items),
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      shippingCost: order.shippingCost,
      shippingName: order.shippingName,
      processingFee: order.processingFee
    }
  });
  return order;
}

export async function getUsers() {
  await ensureCatalogSeeded();
  const rows = await prisma.customerAccount.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({ ...(row.data as UserAccount), id: row.id, email: row.email, passwordHash: row.passwordHash }));
}

export async function getUserByEmail(email: string) {
  await ensureCatalogSeeded();
  const row = await prisma.customerAccount.findUnique({ where: { email: email.toLowerCase() } });
  return row ? { ...(row.data as UserAccount), id: row.id, email: row.email, passwordHash: row.passwordHash } : null;
}

export async function saveUser(user: UserAccount) {
  await ensureCatalogSeeded();
  await prisma.customerAccount.upsert({
    where: { email: user.email.toLowerCase() },
    update: { passwordHash: user.passwordHash, data: asJson(user) },
    create: {
      id: user.id,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
      data: asJson(user)
    }
  });
  return user;
}

export async function deleteOrder(id: string) {
  await prisma.adminOrder.delete({ where: { id } });
}

export async function getClientLogos() {
  await ensureCatalogSeeded();
  const row = await prisma.clientLogoSet.findUnique({ where: { id: "default" } });
  return (row?.logos as string[] | undefined) ?? [];
}

export async function saveClientLogos(logos: string[]) {
  await ensureCatalogSeeded();
  const clientLogos = logos.filter(Boolean);
  await prisma.clientLogoSet.upsert({
    where: { id: "default" },
    update: { logos: asJson(clientLogos) },
    create: { id: "default", logos: asJson(clientLogos) }
  });
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
  const categories: ProductCategory[] = generated.categories.map((category) => ({
    slug: toSlug(category.name),
    name: category.name.charAt(0).toUpperCase() + category.name.slice(1),
    description: `Demo-Kategorie: ${category.name}.`,
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
      short: `${product.reference} Demo-Produkt.`,
      description: product.description,
      seo: `${product.reference} in der Kategorie ${categorySlug}.`,
      heroImage: product.image,
      gallery: [product.image, product.thumbnail],
      rating: 4.5,
      basePrice,
      deliveryText: product.stock > 0 ? "3-5 Werktage" : "Auf Anfrage",
      tags: ["Demo", categorySlug],
      variants: [{
        id: `${productSlug}-default`,
        name: "Standard",
        skuPrefix: productSlug.toUpperCase().slice(0, 12),
        attributes: [{
          key: "size",
          label: "Format",
          type: "select",
          required: true,
          defaultValue: "standard",
          options: [{ value: "standard", label: `${Math.round(product.width)}x${Math.round(product.height)} cm` }]
        }],
        quantityRule: { min: 1, max: 5000, step: 1 },
        priceRules: [
          { key: "basis", label: "Basispreis", type: "fixed", amount: basePrice },
          { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: Number((basePrice * 0.1).toFixed(2)) }
        ]
      }],
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

  await prisma.$transaction(async (tx) => {
    await tx.catalogProduct.deleteMany();
    await tx.catalogCategory.deleteMany();
    for (const category of categories) {
      await tx.catalogCategory.create({
        data: {
          slug: category.slug,
          name: category.name,
          visible: true,
          published: true,
          data: asJson(category)
        }
      });
    }
    for (const product of products) {
      await tx.catalogProduct.create({
        data: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: true,
          published: true,
          data: asJson(product)
        }
      });
    }
  });
  return { categories: categories.length, products: products.length };
}
