import { clampElementToRect, coverZones } from "./geometry";
import { fitTextBlock, normalizeRoleText, roleTypography } from "./typography";
import {
  defaultEmbossingProductionRules,
  EMBOSSING_LAYOUT_VERSION,
  type EmbossingLayoutElement,
  type EmbossingResolvedLayout,
  type EmbossingTextElement,
  type EmbossingTextRole,
  type GenerateEmbossingLayoutInput
} from "./types";

const groupRoles: Record<"top" | "middle" | "bottom", EmbossingTextRole[]> = {
  top: ["institution"],
  middle: ["workType", "title", "subtitle", "custom"],
  bottom: ["author", "year"]
};

const SAFE_TEXT_WIDTH_RATIO = 0.92;

function isUsed(input: GenerateEmbossingLayoutInput, role: EmbossingTextRole) {
  if (role === "custom") return true;
  return input.sourceContent.use?.[role] !== false;
}

function textForRole(input: GenerateEmbossingLayoutInput, role: EmbossingTextRole) {
  if (!isUsed(input, role)) return "";
  if (role === "custom") return "";
  return String(input.sourceContent[role] ?? "").trim();
}

function alignmentX(alignment: "left" | "center" | "right", rect: { x: number; width: number }, widthMm: number) {
  if (alignment === "left") return rect.x;
  if (alignment === "right") return rect.x + rect.width - widthMm;
  return rect.x + rect.width / 2 - widthMm / 2;
}

function buildTextElement(params: {
  role: EmbossingTextRole;
  text: string;
  zone: "top" | "middle" | "bottom";
  rect: { x: number; y: number; width: number; height: number };
  cursorY: number;
  alignment: "left" | "center" | "right";
  fontStyle: "modern" | "classic";
  minFontSizePt: number;
  preferredFontSizePt?: number;
  warnings: string[];
  corrections: string[];
}): EmbossingTextElement | null {
  const normalized = normalizeRoleText(params.text, params.role);
  if (!normalized) return null;
  const weight = params.role === "title" || params.role === "workType" ? 600 : 500;
  const maxWidthMm = params.rect.width * SAFE_TEXT_WIDTH_RATIO * roleTypography[params.role].maxWidthRatio;
  const fit = fitTextBlock({
    text: normalized,
    role: params.role,
    minFontSizePt: params.minFontSizePt,
    preferredFontSizePt: params.preferredFontSizePt,
    maxWidthMm,
    fontStyle: params.fontStyle,
    fontWeight: weight
  });
  if (!fit.ok) params.warnings.push(fit.message);
  const preferred = params.preferredFontSizePt ?? roleTypography[params.role].preferredPt;
  if (fit.ok && fit.fontSizePt < preferred) {
    params.corrections.push(`${labelForRole(params.role)} wurde von ${preferred.toFixed(1)} pt auf ${fit.fontSizePt.toFixed(1)} pt optimiert.`);
  }
  const heightMm = fit.lines.length * fit.lineHeightMm;
  const widthMm = fit.widthMm;
  return {
    type: "text",
    role: params.role,
    text: normalized,
    lines: fit.lines,
    xMm: alignmentX(params.alignment, params.rect, widthMm),
    yMm: params.cursorY,
    widthMm,
    heightMm,
    fontSizePt: fit.fontSizePt,
    lineHeightMm: fit.lineHeightMm,
    letterSpacingMm: fit.letterSpacingMm,
    alignment: params.alignment,
    fontStyle: params.fontStyle,
    weight,
    zone: params.zone
  };
}

function labelForRole(role: EmbossingTextRole) {
  return {
    institution: "Hochschule",
    workType: "Art der Arbeit",
    title: "Titel",
    subtitle: "Untertitel",
    author: "Name",
    year: "Jahr",
    custom: "Eigene Zeile"
  }[role];
}

function groupHeight(elements: EmbossingTextElement[]) {
  return elements.reduce((sum, element, index) => {
    const spacing = index < elements.length - 1 ? roleTypography[element.role].spacingAfterMm : 0;
    return sum + element.heightMm + spacing;
  }, 0);
}

function buildStagedTextElements(params: {
  input: GenerateEmbossingLayoutInput;
  zone: "top" | "middle" | "bottom";
  rect: { x: number; y: number; width: number; height: number };
  alignment: "left" | "center" | "right";
  fontStyle: "modern" | "classic";
  minFontSizePt: number;
  preferredScale: number;
  warnings: string[];
  corrections: string[];
}) {
  const rules = { ...defaultEmbossingProductionRules, ...params.input.productionRules };
  const roles = params.input.template === "minimal"
    ? groupRoles[params.zone].filter((role) => role !== "institution" && role !== "subtitle")
    : groupRoles[params.zone];
  const staged: EmbossingTextElement[] = [];

  for (const role of roles) {
    if (role === "custom") {
      for (const customText of (params.input.sourceContent.customLines ?? []).slice(0, rules.maxCustomLines)) {
        const preferredFontSizePt = roleTypography[role].preferredPt * params.preferredScale;
        const element = buildTextElement({ role, text: customText, zone: params.zone, rect: params.rect, cursorY: 0, alignment: params.alignment, fontStyle: params.fontStyle, minFontSizePt: params.minFontSizePt, preferredFontSizePt, warnings: params.warnings, corrections: params.corrections });
        if (element) staged.push(element);
      }
      continue;
    }
    const text = textForRole(params.input, role);
    const preferredFontSizePt = roleTypography[role].preferredPt * params.preferredScale;
    const element = buildTextElement({ role, text, zone: params.zone, rect: params.rect, cursorY: 0, alignment: params.alignment, fontStyle: params.fontStyle, minFontSizePt: params.minFontSizePt, preferredFontSizePt, warnings: params.warnings, corrections: params.corrections });
    if (element) staged.push(element);
  }

  return staged;
}

function layoutGroup(input: GenerateEmbossingLayoutInput, zone: "top" | "middle" | "bottom", warnings: string[], corrections: string[]) {
  const rules = { ...defaultEmbossingProductionRules, ...input.productionRules };
  const zones = coverZones(input.coverGeometry);
  const rect = zones[zone];
  const alignment = input.advancedAdjustments?.[zone]?.alignment ?? "center";
  const fontStyle = input.fontStyle ?? "modern";

  let logo: EmbossingLayoutElement | null = null;
  if (zone === "top" && input.sourceContent.logo?.url && (input.template === "logo" || input.template === "classic")) {
    const maxWidth = input.coverGeometry.widthMm * rules.maxLogoWidthRatio;
    const widthMm = Math.min(maxWidth, input.sourceContent.logo.widthMm || maxWidth);
    const heightMm = Math.min(rules.maxLogoHeightMm, input.sourceContent.logo.heightMm || 18);
    logo = {
      type: "logo",
      role: "custom",
      zone: "top",
      url: input.sourceContent.logo.url,
      widthMm,
      heightMm,
      xMm: rect.x + rect.width / 2 - widthMm / 2,
      yMm: 0
    };
  }

  let staged: EmbossingTextElement[] = [];
  for (let preferredScale = 1; preferredScale >= 0.72; preferredScale -= 0.04) {
    const attemptWarnings: string[] = [];
    const attemptCorrections: string[] = [];
    const attempt = buildStagedTextElements({ input, zone, rect, alignment, fontStyle, minFontSizePt: rules.minFontSizePt, preferredScale, warnings: attemptWarnings, corrections: attemptCorrections });
    const attemptHeight = groupHeight(attempt) + (logo ? logo.heightMm + 5 : 0);
    if (attemptHeight <= rect.height) {
      warnings.push(...attemptWarnings);
      corrections.push(...attemptCorrections);
      staged = attempt;
      break;
    }
    staged = attempt;
  }

  const totalHeight = groupHeight(staged) + (logo ? logo.heightMm + 5 : 0);
  if (totalHeight > rect.height) {
    warnings.push(`${zone === "top" ? "Oberer" : zone === "middle" ? "Mittlerer" : "Unterer"} Prägebereich ist zu hoch für die gewählten Texte.`);
  }
  let cursorY = rect.y + rect.height / 2 - totalHeight / 2 + (input.advancedAdjustments?.[zone]?.offsetYMm ?? 0);
  cursorY = Math.max(rect.y, Math.min(cursorY, rect.y + rect.height - totalHeight));
  const elements: EmbossingLayoutElement[] = [];
  if (logo) {
    logo = { ...logo, yMm: cursorY };
    elements.push(clampElementToRect(logo, rect));
    cursorY += logo.heightMm + 5;
  }
  for (const [index, element] of staged.entries()) {
    const positioned = { ...element, yMm: cursorY, xMm: alignmentX(alignment, rect, element.widthMm) };
    elements.push(positioned);
    cursorY += element.heightMm + (index < staged.length - 1 ? roleTypography[element.role].spacingAfterMm : 0);
  }
  return elements;
}

export function generateEmbossingLayout(input: GenerateEmbossingLayoutInput): EmbossingResolvedLayout {
  const corrections: string[] = [];
  const warnings: string[] = [];
  const allElements = [
    ...layoutGroup(input, "top", warnings, corrections),
    ...layoutGroup(input, "middle", warnings, corrections),
    ...layoutGroup(input, "bottom", warnings, corrections)
  ];
  return {
    layoutVersion: EMBOSSING_LAYOUT_VERSION,
    template: input.template,
    fontStyle: input.fontStyle ?? "modern",
    coverGeometry: input.coverGeometry,
    elements: allElements,
    lineCount: allElements.reduce((sum, element) => sum + (element.type === "text" ? element.lines.length : 0), 0),
    corrections: Array.from(new Set(corrections)),
    warnings: Array.from(new Set(warnings))
  };
}
