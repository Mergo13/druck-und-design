import { strict as assert } from "assert";
import { deriveBrochureProduction, deriveDocumentProduction, pricingQuantitiesForDocument } from "@/lib/document-production";

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
  printedCoverSides: 6,
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

const brochureNoCover = deriveDocumentProduction({
  brochureConfig: "true",
  "PDF-Seiten": "48",
  brochureSeparateCover: "no",
  brochureBinding: "klebebindung"
}, 50);
assert.equal(brochureNoCover.pagesPerCopy, 48);
assert.equal(brochureNoCover.quantity, 50);
assert.equal(brochureNoCover.totalPrintedPages, 2400);

const brochureSeparateCover = deriveBrochureProduction({
  brochureConfig: "true",
  "PDF-Seiten": "48",
  brochureSeparateCover: "yes",
  brochureBinding: "klebebindung"
}, 50);
assert.equal(brochureSeparateCover.coverMapping.U1, "1");
assert.equal(brochureSeparateCover.coverMapping.U2, "2");
assert.equal(brochureSeparateCover.coverMapping.U3, "47");
assert.equal(brochureSeparateCover.coverMapping.U4, "48");
assert.equal(brochureSeparateCover.pagesPerCopy, 44);
assert.equal(brochureSeparateCover.printedCoverSidesPerCopy, 4);

const brochureBlankInsideCover = deriveBrochureProduction({
  brochureConfig: "true",
  "PDF-Seiten": "48",
  brochureSeparateCover: "yes",
  brochureCoverU1: "1",
  brochureCoverU2: "blank",
  brochureCoverU3: "blank",
  brochureCoverU4: "48",
  brochureBinding: "klebebindung"
}, 50);
assert.equal(brochureBlankInsideCover.pagesPerCopy, 46);
assert.equal(brochureBlankInsideCover.printedCoverSidesPerCopy, 2);
assert.deepEqual(pricingQuantitiesForDocument({
  brochureConfig: "true",
  "PDF-Seiten": "48",
  brochureSeparateCover: "yes",
  brochureCoverU1: "1",
  brochureCoverU2: "blank",
  brochureCoverU3: "blank",
  brochureCoverU4: "48",
  brochureBinding: "klebebindung"
}, 50)?.printedCoverSides, 100);

const brochureRuckstichPadding = deriveBrochureProduction({
  brochureConfig: "true",
  "PDF-Seiten": "50",
  brochureSeparateCover: "no",
  brochureBinding: "Rückstichheftung"
}, 50);
assert.equal(brochureRuckstichPadding.blankProductionPages, 2);

console.log("document-production tests passed");
