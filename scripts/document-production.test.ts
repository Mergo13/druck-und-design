import { strict as assert } from "assert";
import { deriveDocumentProduction, pricingQuantitiesForDocument } from "@/lib/document-production";

const duplexConfig = {
  seitenanzahl: "26",
  auflage: "3",
  Druckseiten: "Beidseitig"
};

const duplex = deriveDocumentProduction(duplexConfig, 3);
assert.equal(duplex.pagesPerCopy, 26);
assert.equal(duplex.quantity, 3);
assert.equal(duplex.totalPrintedPages, 78);
assert.equal(duplex.sheetsPerCopy, 13);
assert.equal(duplex.totalSheets, 39);
assert.deepEqual(pricingQuantitiesForDocument(duplexConfig, 3), {
  baseQuantity: 78,
  propertyQuantity: 3
});

const oddDuplex = deriveDocumentProduction({
  "Seiten pro Exemplar": "27",
  Druckseiten: "duplex"
}, 3);
assert.equal(oddDuplex.sheetsPerCopy, 14);
assert.equal(oddDuplex.totalSheets, 42);

const simplex = deriveDocumentProduction({
  "PDF-Seiten": "26",
  Druckseiten: "Einseitig"
}, 3);
assert.equal(simplex.totalPrintedPages, 78);
assert.equal(simplex.sheetsPerCopy, 26);
assert.equal(simplex.totalSheets, 78);

console.log("document-production tests passed");
