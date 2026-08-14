import assert from "node:assert/strict";
import {
  calculateSheets,
  colorAccounting,
  getAvailableBindings,
  parsePageRange,
  recognizeIsoFormat,
  summarizeMixedPageSizes,
  type PdfPageSize
} from "@/lib/student-print-config";

assert.equal(calculateSheets(82, "duplex"), 41);
assert.equal(calculateSheets(83, "duplex"), 42);
assert.equal(calculateSheets(82, "simplex"), 82);

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
