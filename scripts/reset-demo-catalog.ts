import "dotenv/config";
import { resetDemoCatalog } from "../lib/catalog-repository";

async function main() {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Abbruch: Bitte mit --confirm bestätigen. Nur Produkte und Produktkategorien werden ersetzt.");
  }
  const result = await resetDemoCatalog();
  console.log(`Demo-Katalog aktualisiert: ${result.products} Produkte in ${result.categories} Kategorien.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
