import { elementBounds, elementsOverlap, safeRect } from "./geometry";
import { embossingFontStyles, textWidthMm } from "./typography";
import { defaultEmbossingProductionRules, type EmbossingProductionRules, type EmbossingResolvedLayout } from "./types";

export type EmbossingPreflightCheck = {
  code: string;
  label: string;
  passed: boolean;
  message?: string;
};

export function validateEmbossingLayout(layout: EmbossingResolvedLayout, productionRules?: Partial<EmbossingProductionRules>) {
  const rules = { ...defaultEmbossingProductionRules, ...productionRules };
  const safe = safeRect(layout.coverGeometry);
  const checks: EmbossingPreflightCheck[] = [];

  const insideSafe = layout.elements.every((element) => {
    const bounds = elementBounds(element);
    return bounds.left >= safe.x &&
      bounds.top >= safe.y &&
      bounds.right <= safe.right + 0.01 &&
      bounds.bottom <= safe.bottom + 0.01;
  });
  checks.push({
    code: "safe-area",
    label: "Alle Elemente innerhalb des Prägebereichs",
    passed: insideSafe,
    message: insideSafe ? undefined : "Ein Element liegt außerhalb des sicheren Prägebereichs."
  });

  const fontSafe = layout.elements
    .filter((element) => element.type === "text")
    .every((element) => element.fontSizePt >= rules.minFontSizePt);
  checks.push({
    code: "font-size",
    label: "Schriftgrößen produktionssicher",
    passed: fontSafe,
    message: fontSafe ? undefined : `Eine Schrift ist kleiner als ${rules.minFontSizePt} pt.`
  });

  const textWidthsValid = !layout.warnings.some((warning) => /zu lang|sichere Prägung/i.test(warning));
  const measuredTextInside = layout.elements
    .filter((element) => element.type === "text")
    .every((element) => element.lines.every((line) => {
      const lineWidth = textWidthMm(line, element.fontSizePt, element.fontStyle, element.weight, element.letterSpacingMm);
      return lineWidth <= element.widthMm + 0.01 && lineWidth <= safe.width * 0.92 + 0.01;
    }));
  checks.push({
    code: "text-width",
    label: "Textbreiten gültig",
    passed: textWidthsValid && measuredTextInside,
    message: textWidthsValid && measuredTextInside ? undefined : "Ein Text ist zu lang für eine sichere Prägung."
  });

  const noOverlap = layout.elements.every((element, index) => {
    return layout.elements.slice(index + 1).every((other) => !elementsOverlap(element, other, 0));
  });
  checks.push({
    code: "overlap",
    label: "Keine Überlappungen",
    passed: noOverlap,
    message: noOverlap ? undefined : "Elemente überlappen sich."
  });

  const groups = {
    top: layout.elements.filter((element) => element.zone === "top"),
    middle: layout.elements.filter((element) => element.zone === "middle"),
    bottom: layout.elements.filter((element) => element.zone === "bottom")
  };
  const groupBottom = (items: typeof layout.elements) => Math.max(...items.map((item) => elementBounds(item).bottom), 0);
  const groupTop = (items: typeof layout.elements) => Math.min(...items.map((item) => elementBounds(item).top), Number.POSITIVE_INFINITY);
  const separated = (!groups.top.length || !groups.middle.length || groupBottom(groups.top) + rules.minGroupSeparationMm <= groupTop(groups.middle)) &&
    (!groups.middle.length || !groups.bottom.length || groupBottom(groups.middle) + rules.minGroupSeparationMm <= groupTop(groups.bottom));
  checks.push({
    code: "group-separation",
    label: "Gruppenabstände gültig",
    passed: separated,
    message: separated ? undefined : "Textgruppen liegen zu nah beieinander."
  });

  checks.push({
    code: "font-available",
    label: "Produktionsfont verfügbar",
    passed: Boolean(embossingFontStyles[layout.fontStyle]),
    message: embossingFontStyles[layout.fontStyle] ? undefined : "Der gewählte Produktionsfont ist nicht verfügbar."
  });

  const logoInside = layout.elements
    .filter((element) => element.type === "logo")
    .every((element) => {
      const bounds = elementBounds(element);
      return bounds.left >= safe.x && bounds.right <= safe.right && bounds.top >= safe.y && bounds.bottom <= safe.bottom;
    });
  checks.push({
    code: "logo",
    label: "Logo innerhalb des Bereichs",
    passed: logoInside,
    message: logoInside ? undefined : "Das Logo liegt außerhalb des sicheren Prägebereichs."
  });

  checks.push({
    code: "logo-details",
    label: "Keine zu kleinen Logo-Details soweit prüfbar",
    passed: true,
    message: "Logo-Detailprüfung ist bei manchen Dateitypen nur eingeschränkt möglich."
  });

  const valid = checks.filter((check) => check.code !== "logo-details").every((check) => check.passed);
  return {
    valid,
    checks,
    errors: checks.filter((check) => !check.passed && check.code !== "logo-details").map((check) => check.message || check.label),
    warnings: [
      ...layout.warnings,
      ...checks.filter((check) => check.code === "logo-details").map((check) => check.message || check.label)
    ].filter(Boolean)
  };
}
