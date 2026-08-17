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
  propertyQuantity: 3,
  copies: 3,
  printedPages: 78,
  sheets: 39,
  blackWhitePages: 78,
  colorPages: 0,
  frontCovers: 3,
  backCovers: 3,
  perOrder: 1
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

const fullColor = deriveDocumentProduction({
  "PDF-Seiten": "18",
  printColorMode: "full_color"
}, 5);
assert.equal(fullColor.totalPrintedPages, 90);
assert.equal(fullColor.totalColorPages, 90);
assert.equal(fullColor.totalBlackWhitePages, 0);

const mixed = deriveDocumentProduction({
  "PDF-Seiten": "18",
  printColorMode: "auto",
  pdfAnalysisColorPageCount: "4",
  pdfAnalysisBwPageCount: "14"
}, 5);
assert.equal(mixed.colorPagesPerCopy, 4);
assert.equal(mixed.blackWhitePagesPerCopy, 14);
assert.equal(mixed.totalColorPages, 20);
assert.equal(mixed.totalBlackWhitePages, 70);

console.log("document-production tests passed");
