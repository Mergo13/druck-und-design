import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CatalogTransferFile = {
  version: 1;
  exportedAt: string;
  sourceDatabase?: string;
  categories: Array<{
    slug: string;
    name: string;
    visible: boolean;
    published: boolean;
    data: unknown;
  }>;
  properties: Array<{
    slug: string;
    name: string;
    active: boolean;
    sortOrder: number;
    data: unknown;
  }>;
  products: Array<{
    slug: string;
    name: string;
    category: string;
    visible: boolean;
    published: boolean;
    data: unknown;
  }>;
};

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function usage() {
  console.log("Usage:");
  console.log("  npm run catalog:export -- ./catalog-transfer.json");
  console.log("  npm run catalog:import -- ./catalog-transfer.json");
  console.log("  npm run catalog:import -- ./catalog-transfer.json --replace");
}

function requireFileArg(value?: string) {
  if (!value || value.startsWith("--")) {
    usage();
    process.exit(1);
  }
  return path.resolve(process.cwd(), value);
}

async function exportCatalog(filePath: string) {
  const [categories, properties, products] = await Promise.all([
    prisma.catalogCategory.findMany({ orderBy: { slug: "asc" } }),
    prisma.catalogProperty.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] }),
    prisma.catalogProduct.findMany({ orderBy: { slug: "asc" } })
  ]);
  const payload: CatalogTransferFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceDatabase: process.env.DATABASE_URL,
    categories: categories.map((item) => ({
      slug: item.slug,
      name: item.name,
      visible: item.visible,
      published: item.published,
      data: item.data
    })),
    properties: properties.map((item) => ({
      slug: item.slug,
      name: item.name,
      active: item.active,
      sortOrder: item.sortOrder,
      data: item.data
    })),
    products: products.map((item) => ({
      slug: item.slug,
      name: item.name,
      category: item.category,
      visible: item.visible,
      published: item.published,
      data: item.data
    }))
  };
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Exported ${payload.categories.length} categories, ${payload.properties.length} properties, ${payload.products.length} products to ${filePath}`);
}

function validatePayload(payload: CatalogTransferFile) {
  if (payload.version !== 1) throw new Error("Unsupported catalog transfer file version.");
  if (!Array.isArray(payload.categories) || !Array.isArray(payload.properties) || !Array.isArray(payload.products)) {
    throw new Error("Invalid catalog transfer file.");
  }
  const categorySlugs = new Set(payload.categories.map((item) => item.slug));
  for (const product of payload.products) {
    if (!categorySlugs.has(product.category)) {
      throw new Error(`Product "${product.slug}" references missing category "${product.category}".`);
    }
  }
}

async function importCatalog(filePath: string, replace: boolean) {
  const raw = await fs.readFile(filePath, "utf8");
  const payload = JSON.parse(raw) as CatalogTransferFile;
  validatePayload(payload);

  await prisma.$transaction(async (tx) => {
    for (const category of payload.categories) {
      await tx.catalogCategory.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          visible: category.visible,
          published: category.published,
          data: asJson(category.data)
        },
        create: {
          slug: category.slug,
          name: category.name,
          visible: category.visible,
          published: category.published,
          data: asJson(category.data)
        }
      });
    }

    for (const property of payload.properties) {
      await tx.catalogProperty.upsert({
        where: { slug: property.slug },
        update: {
          name: property.name,
          active: property.active,
          sortOrder: property.sortOrder,
          data: asJson(property.data)
        },
        create: {
          slug: property.slug,
          name: property.name,
          active: property.active,
          sortOrder: property.sortOrder,
          data: asJson(property.data)
        }
      });
    }

    for (const product of payload.products) {
      await tx.catalogProduct.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          category: product.category,
          visible: product.visible,
          published: product.published,
          data: asJson(product.data)
        },
        create: {
          slug: product.slug,
          name: product.name,
          category: product.category,
          visible: product.visible,
          published: product.published,
          data: asJson(product.data)
        }
      });
    }

    if (replace) {
      const categorySlugs = payload.categories.map((item) => item.slug);
      const propertySlugs = payload.properties.map((item) => item.slug);
      const productSlugs = payload.products.map((item) => item.slug);
      await tx.catalogProduct.deleteMany({ where: { slug: { notIn: productSlugs } } });
      await tx.catalogProperty.deleteMany({ where: { slug: { notIn: propertySlugs } } });
      await tx.catalogCategory.deleteMany({ where: { slug: { notIn: categorySlugs } } });
    }
  });

  console.log(`Imported ${payload.categories.length} categories, ${payload.properties.length} properties, ${payload.products.length} products from ${filePath}${replace ? " with replace mode" : ""}`);
}

async function main() {
  const [command, fileArg, ...flags] = process.argv.slice(2);
  const filePath = requireFileArg(fileArg);
  if (command === "export") {
    await exportCatalog(filePath);
    return;
  }
  if (command === "import") {
    await importCatalog(filePath, flags.includes("--replace"));
    return;
  }
  usage();
  process.exit(1);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
