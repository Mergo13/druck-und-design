import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { generateEmbossingLayout } from "@/lib/embossing/layout";
import { renderEmbossingProductionFiles } from "@/lib/embossing/production-renderer";
import { findOwnedEmbossingDesign } from "@/lib/embossing/server";
import { defaultCoverGeometry, defaultEmbossingProductionRules, type EmbossingSourceContent } from "@/lib/embossing/types";
import { elementBounds, safeRect } from "@/lib/embossing/geometry";
import { validateEmbossingLayout } from "@/lib/embossing/validation";
import { prisma } from "@/lib/prisma";

const source: EmbossingSourceContent = {
  institution: "FH Oberösterreich",
  workType: "Bachelorarbeit",
  title: "Automatisierung von Druckprozessen mit künstlicher Intelligenz",
  author: "Max Mustermann",
  year: "2026"
};

const layout = generateEmbossingLayout({
  coverGeometry: defaultCoverGeometry,
  sourceContent: source,
  template: "classic",
  fontStyle: "modern",
  productionRules: defaultEmbossingProductionRules
});

const safe = safeRect(defaultCoverGeometry);
for (const element of layout.elements) {
  const bounds = elementBounds(element);
  assert.ok(bounds.left >= safe.x, "element must not leave left safe area");
  assert.ok(bounds.right <= safe.right + 0.01, "element must not leave right safe area");
  assert.ok(bounds.top >= safe.y, "element must not leave top safe area");
  assert.ok(bounds.bottom <= safe.bottom + 0.01, "element must not leave bottom safe area");
}

const title = layout.elements.find((element) => element.type === "text" && element.role === "title");
assert.ok(title?.type === "text", "title element exists");
assert.ok(title.lines.length > 1, "long title wraps to multiple lines");
assert.ok(title.fontSizePt >= defaultEmbossingProductionRules.minFontSizePt, "font fitting must not drop below production minimum");

const grouped = {
  top: layout.elements.filter((element) => element.zone === "top"),
  middle: layout.elements.filter((element) => element.zone === "middle"),
  bottom: layout.elements.filter((element) => element.zone === "bottom")
};
const bottom = (items: typeof layout.elements) => Math.max(...items.map((item) => elementBounds(item).bottom), 0);
const top = (items: typeof layout.elements) => Math.min(...items.map((item) => elementBounds(item).top), Number.POSITIVE_INFINITY);
assert.ok(bottom(grouped.top) < top(grouped.middle), "top and middle groups must not overlap");
assert.ok(bottom(grouped.middle) < top(grouped.bottom), "middle and bottom groups must not overlap");

const expectedLineCount = layout.elements.reduce((sum, element) => sum + (element.type === "text" ? element.lines.length : 0), 0);
assert.equal(layout.lineCount, expectedLineCount, "resolved visual lines drive pricing line count");

const layoutAgain = generateEmbossingLayout({
  coverGeometry: defaultCoverGeometry,
  sourceContent: source,
  template: "classic",
  fontStyle: "modern",
  productionRules: defaultEmbossingProductionRules
});
assert.deepEqual(layoutAgain.elements.map(({ xMm, yMm, widthMm, heightMm }) => ({ xMm, yMm, widthMm, heightMm })), layout.elements.map(({ xMm, yMm, widthMm, heightMm }) => ({ xMm, yMm, widthMm, heightMm })), "same input and version must reproduce coordinates");

const preflight = validateEmbossingLayout(layout, defaultEmbossingProductionRules);
assert.equal(preflight.valid, true, "generated layout must pass preflight");

async function main() {
  const designId = `test-${randomUUID()}`;
  const ownerId = `owner-${randomUUID()}`;
  await (prisma as any).embossingDesign.create({
    data: {
      id: designId,
      userId: ownerId,
      productId: "abschlussarbeiten",
      embossingColor: "gold",
      template: "classic",
      layoutVersion: layout.layoutVersion,
      coverGeometry: defaultCoverGeometry,
      sourceContent: source,
      resolvedLayout: layout,
      productionRules: defaultEmbossingProductionRules,
      lineCount: layout.lineCount,
      status: "draft"
    }
  });
  assert.equal(await findOwnedEmbossingDesign(designId, `other-${randomUUID()}`), null, "user cannot read another user's design");
  await (prisma as any).embossingDesign.delete({ where: { id: designId } });

  const files = await renderEmbossingProductionFiles({
    designId: `test-${randomUUID()}`,
    layout,
    embossingColor: "gold"
  });
  assert.ok(files.productionPdfUrl.endsWith(".pdf"), "finalization creates production PDF metadata");
  assert.ok(existsSync(path.join(process.cwd(), "public", files.productionPdfUrl.replace(/^\/+/, ""))), "production PDF exists");

  console.log("Embossing tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
