import assert from "node:assert/strict";
import {
  calculateSheets,
  colorAccounting,
  deriveStudentProductionQuantities,
  getAvailableBindings,
  parsePageRange,
  recognizeIsoFormat,
  summarizeMixedPageSizes,
  type PdfPageSize
} from "@/lib/student-print-config";

assert.equal(calculateSheets(82, "duplex"), 41);
assert.equal(calculateSheets(83, "duplex"), 42);
assert.equal(calculateSheets(82, "simplex"), 82);

const baseAnalysis = {
  fileName: "arbeit.pdf",
  pages: 26,
  pageSizes: [],
  colorPages: [1, 2, 3, 4, 5, 6],
  bwPages: Array.from({ length: 20 }, (_, index) => index + 7),
  warnings: [],
  valid: true
};
assert.deepEqual(deriveStudentProductionQuantities({
  quantity: 1,
  printSides: "simplex",
  colorMode: "auto",
  manualColorPages: []
}, baseAnalysis), {
  pageCount: 26,
  quantity: 1,
  printSides: "simplex",
  sheetsPerCopy: 26,
  totalPrintedPages: 26,
  totalSheets: 26,
  colorPagesPerCopy: 6,
  bwPagesPerCopy: 20,
  totalColorPages: 6,
  totalBwPages: 20
});
assert.deepEqual(deriveStudentProductionQuantities({
  quantity: 3,
  printSides: "duplex",
  colorMode: "auto",
  manualColorPages: []
}, baseAnalysis), {
  pageCount: 26,
  quantity: 3,
  printSides: "duplex",
  sheetsPerCopy: 13,
  totalPrintedPages: 78,
  totalSheets: 39,
  colorPagesPerCopy: 6,
  bwPagesPerCopy: 20,
  totalColorPages: 18,
  totalBwPages: 60
});
assert.equal(deriveStudentProductionQuantities({
  quantity: 3,
  printSides: "duplex",
  colorMode: "bw",
  manualColorPages: []
}, { ...baseAnalysis, pages: 27, colorPages: [], bwPages: Array.from({ length: 27 }, (_, index) => index + 1) }).sheetsPerCopy, 14);
assert.equal(deriveStudentProductionQuantities({
  quantity: 3,
  printSides: "duplex",
  colorMode: "bw",
  manualColorPages: []
}, { ...baseAnalysis, pages: 27, colorPages: [], bwPages: Array.from({ length: 27 }, (_, index) => index + 1) }).totalSheets, 42);

assert.equal(recognizeIsoFormat(210, 297), "A4");
assert.equal(recognizeIsoFormat(211.8, 296.2), "A4");
assert.equal(recognizeIsoFormat(297, 420), "A3");

assert.deepEqual(parsePageRange("1,2,5-8", 10), { pages: [1, 2, 5, 6, 7, 8], error: "" });
assert.deepEqual(parsePageRange(" 2 , 2, 4 - 5 ", 10), { pages: [2, 4, 5], error: "" });
assert.equal(parsePageRange("1,2,14", 10).error, "Die Seite 14 existiert nicht. Das Dokument hat 10 Seiten.");
assert.equal(parsePageRange("0", 10).error, "Seitennummern müssen größer als 0 sein.");

const accounting = colorAccounting(126, Array.from({ length: 18 }, (_, index) => index + 1));
assert.equal(accounting.colorCount, 18);
assert.equal(accounting.bwCount, 108);

const mixed: PdfPageSize[] = [
  { page: 1, widthMm: 210, heightMm: 297, format: "A4", orientation: "portrait" },
  { page: 2, widthMm: 210, heightMm: 297, format: "A4", orientation: "portrait" },
  { page: 3, widthMm: 297, heightMm: 420, format: "A3", orientation: "portrait" }
];
const groups = summarizeMixedPageSizes(mixed);
assert.equal(groups.length, 2);
assert.equal(groups[0].label, "A4");
assert.deepEqual(groups[1].pages, [3]);

const bindings = getAvailableBindings({ pages: 86, sheets: 43, format: "A4", presetKey: "bachelorarbeit" });
assert.equal(bindings.find((binding) => binding.value === "hardcover")?.available, true);
assert.equal(getAvailableBindings({ pages: 86, sheets: 43, format: "A3", presetKey: "bachelorarbeit" }).find((binding) => binding.value === "hardcover")?.available, false);

console.log("student-print-config tests passed");
