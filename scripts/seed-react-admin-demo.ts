import { seedFromReactAdminDataGenerator } from "../lib/catalog-repository";

async function run() {
  const result = await seedFromReactAdminDataGenerator();
  console.log(`Seeded react-admin demo data: ${result.categories} categories, ${result.products} products.`);
}

void run();
