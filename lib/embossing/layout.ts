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
  warnings: string[];
  corrections: string[];
}): EmbossingTextElement | null {
  const normalized = normalizeRoleText(params.text, params.role);
  if (!normalized) return null;
  const fit = fitTextBlock({
    text: normalized,
    role: params.role,
    minFontSizePt: params.minFontSizePt,
    maxWidthMm: params.rect.width,
    fontStyle: params.fontStyle
  });
  if (!fit.ok) params.warnings.push(fit.message);
  if (fit.ok && fit.fontSizePt < roleTypography[params.role].preferredPt) {
    params.corrections.push(`${labelForRole(params.role)} wurde von ${roleTypography[params.role].preferredPt} pt auf ${fit.fontSizePt} pt optimiert.`);
  }
  const heightMm = fit.lines.length * fit.lineHeightMm;
  const widthMm = Math.min(params.rect.width, fit.widthMm);
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
    alignment: params.alignment,
    fontStyle: params.fontStyle,
    weight: params.role === "title" || params.role === "workType" ? 600 : 500,
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

function layoutGroup(input: GenerateEmbossingLayoutInput, zone: "top" | "middle" | "bottom", warnings: string[], corrections: string[]) {
  const rules = { ...defaultEmbossingProductionRules, ...input.productionRules };
  const zones = coverZones(input.coverGeometry);
  const rect = zones[zone];
  const alignment = input.advancedAdjustments?.[zone]?.alignment ?? "center";
  const fontStyle = input.fontStyle ?? "modern";
  const roles = input.template === "minimal"
    ? groupRoles[zone].filter((role) => role !== "institution" && role !== "subtitle")
    : groupRoles[zone];
  const staged: EmbossingTextElement[] = [];

  for (const role of roles) {
    if (role === "custom") {
      for (const customText of (input.sourceContent.customLines ?? []).slice(0, rules.maxCustomLines)) {
        const element = buildTextElement({ role, text: customText, zone, rect, cursorY: 0, alignment, fontStyle, minFontSizePt: rules.minFontSizePt, warnings, corrections });
        if (element) staged.push(element);
      }
      continue;
    }
    const text = textForRole(input, role);
    const element = buildTextElement({ role, text, zone, rect, cursorY: 0, alignment, fontStyle, minFontSizePt: rules.minFontSizePt, warnings, corrections });
    if (element) staged.push(element);
  }

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

  const totalHeight = groupHeight(staged) + (logo ? logo.heightMm + 5 : 0);
  let cursorY = rect.y + rect.height / 2 - totalHeight / 2 + (input.advancedAdjustments?.[zone]?.offsetYMm ?? 0);
  const elements: EmbossingLayoutElement[] = [];
  if (logo) {
    logo = { ...logo, yMm: cursorY };
    elements.push(clampElementToRect(logo, rect));
    cursorY += logo.heightMm + 5;
  }
  for (const [index, element] of staged.entries()) {
    const positioned = { ...element, yMm: cursorY, xMm: alignmentX(alignment, rect, element.widthMm) };
    elements.push(clampElementToRect(positioned, rect));
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
