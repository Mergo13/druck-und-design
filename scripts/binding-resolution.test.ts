import assert from "node:assert/strict";
import {
  calculateBlockThickness,
  calculateSheetCount,
  createDocumentMetrics,
  getAvailableBindingColors,
  opusCBind,
  resolveBindingSize,
  type BindingVariant,
  type BindingSystem
} from "@/lib/binding-resolution";

const system: BindingSystem = {
  id: "test-wire",
  slug: "test-wire",
  label: "Test Wire",
  pitch: "3:1",
  safetyMarginMm: 0.3,
  colors: ["schwarz", "weiss"],
  formatConfig: {
    A4: { ringCount: 34 },
    A5: { ringCount: 24 }
  },
  sizes: [
    { value: "small-inactive", label: "Inactive", maxBlockThicknessMm: 2, active: false },
    { value: "small", label: "Small", diameterMm: 4.8, maxBlockThicknessMm: 3.5 },
    { value: "medium", label: "Medium", diameterMm: 9.5, maxBlockThicknessMm: 6.7 },
    { value: "large", label: "Large", diameterMm: 12.7, maxBlockThicknessMm: 10, availableColors: ["weiss"] }
  ]
};

assert.equal(calculateSheetCount(26, "simplex"), 26);
assert.equal(calculateSheetCount(26, "duplex"), 13);
assert.equal(calculateSheetCount(27, "duplex"), 14);
assert.equal(calculateBlockThickness({ sheetCount: 10, paperThicknessMm: 0.1 }), 1);
assert.equal(calculateBlockThickness({ sheetCount: 10, paperThicknessMm: 0.1, frontCoverThicknessMm: 0.25, backCoverThicknessMm: 0.25 }), 1.5);
assert.deepEqual(createDocumentMetrics({ pageCount: 27, printMode: "duplex", paperCaliperMm: 0.1 }), {
  pageCount: 27,
  printMode: "duplex",
  sheetCount: 14,
  blockThicknessMm: 1.4
});

const basicWire = resolveBindingSize({
  bindingSystem: system,
  pageCount: 20,
  printMode: "simplex",
  paper: { thicknessMm: 0.1 },
  format: "A4"
});
assert.equal(basicWire.status, "resolved");
assert.equal(basicWire.sizeValue, "small");
assert.equal(basicWire.diameterMm, 4.8);
assert.equal(basicWire.blockThicknessMm, 2);
assert.equal(basicWire.requiredThicknessMm, 2.3);
assert.equal(basicWire.sheetCount, 20);
assert.equal(basicWire.ringCount, 34);

assert.match(
  JSON.stringify(resolveBindingSize({
    bindingSystem: system,
    pageCount: 64,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 },
    blockThicknessMm: 6.4
  })),
  /"diameterMm":9.5/
);

assert.equal(
  resolveBindingSize({
    bindingSystem: { ...system, safetyMarginMm: 0 },
    pageCount: 35,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 }
  }).sizeValue,
  "small"
);

assert.equal(
  resolveBindingSize({
    bindingSystem: system,
    pageCount: 35,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 }
  }).sizeValue,
  "medium"
);

assert.equal(
  resolveBindingSize({
    bindingSystem: system,
    pageCount: 200,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 }
  }).reason,
  "block-too-thick"
);

assert.equal(
  resolveBindingSize({
    bindingSystem: system,
    pageCount: 90,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 },
    color: "schwarz"
  }).reason,
  "color-unavailable"
);

assert.equal(
  resolveBindingSize({
    bindingSystem: system,
    pageCount: 90,
    printMode: "simplex",
    paper: { thicknessMm: 0.1 },
    color: "weiss",
    format: "A5"
  }).ringCount,
  24
);

const first = resolveBindingSize({ bindingSystem: system, pageCount: 94, printMode: "duplex", paper: { thicknessMm: 0.1 } });
const second = resolveBindingSize({ bindingSystem: system, pageCount: 94, printMode: "simplex", paper: { thicknessMm: 0.1 } });
assert.notEqual(first.sizeValue, second.sizeValue);

const opusVariants: BindingVariant[] = [
  { id: "opus-b-black", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-b", seriesValue: "classic", colorValue: "schwarz", active: true, sku: "OPUS-B-BLACK" },
  { id: "opus-c-black", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-c", seriesValue: "classic", colorValue: "schwarz", active: true, sku: "OPUS-C-BLACK" },
  { id: "opus-d-black", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-d", seriesValue: "classic", colorValue: "schwarz", active: true, sku: "OPUS-D-BLACK" },
  { id: "opus-e-black", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-e", seriesValue: "classic", colorValue: "schwarz", active: true, sku: "OPUS-E-BLACK" },
  { id: "opus-c-blue-inactive", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-c", seriesValue: "classic", colorValue: "blau", active: false }
];

assert.equal(
  resolveBindingSize({
    bindingSystem: opusCBind,
    pageCount: 240,
    printMode: "duplex",
    paper: { caliperMm: 0.1, grammageGsm: 80 },
    color: "schwarz",
    series: "classic",
    variants: opusVariants
  }).sizeValue,
  "B"
);

const opus160 = resolveBindingSize({
  bindingSystem: opusCBind,
  pageCount: 200,
  printMode: "duplex",
  paper: { caliperMm: 0.16, grammageGsm: 160 },
  color: "schwarz",
  series: "classic",
  variants: opusVariants
});
assert.equal(opus160.sizeValue, "D");
assert.equal(opus160.equivalentReferenceSheets, 160);
assert.equal(opus160.estimated, false);
assert.equal(opus160.variantId, "opus-d-black");
assert.equal(opus160.sku, "OPUS-D-BLACK");

const opusEstimate = resolveBindingSize({
  bindingSystem: opusCBind,
  pageCount: 200,
  printMode: "duplex",
  paper: { grammageGsm: 160 },
  color: "schwarz",
  series: "classic",
  variants: opusVariants
});
assert.equal(opusEstimate.sizeValue, "E");
assert.equal(opusEstimate.estimated, true);

assert.equal(
  resolveBindingSize({
    bindingSystem: opusCBind,
    pageCount: 200,
    printMode: "duplex",
    paper: { caliperMm: 0.16 },
    color: "blau",
    series: "classic",
    variants: opusVariants
  }).reason,
  "color-unavailable"
);

assert.deepEqual(getAvailableBindingColors({ variants: opusVariants, bindingSystemId: "opus-c-bind", bindingSizeId: "opus-c", series: "classic" }), ["schwarz"]);

console.log("binding-resolution tests passed");
