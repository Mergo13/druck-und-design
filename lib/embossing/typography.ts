import { Encodings, Font, FontNames } from "@pdf-lib/standard-fonts";
import type { EmbossingTextRole } from "./types";

const PT_TO_MM = 25.4 / 72;

type FontStyle = "modern" | "classic";

export type EmbossingFontRule = {
  min: number;
  recommendedMin: number;
  recommendedMax: number;
  max: number;
  default: number;
};

export const embossingFontStyles = {
  modern: {
    label: "Modern",
    family: "Helvetica",
    pdfFont: "Helvetica",
    titleWeight: 600,
    bodyWeight: 500
  },
  classic: {
    label: "Klassisch",
    family: "Times-Roman",
    pdfFont: "Times-Roman",
    titleWeight: 600,
    bodyWeight: 500
  }
} as const;

export const embossingFontRules: Record<EmbossingTextRole, EmbossingFontRule> = {
  institution: { min: 10, recommendedMin: 14, recommendedMax: 18, max: 22, default: 16 },
  workType: { min: 12, recommendedMin: 16, recommendedMax: 22, max: 26, default: 18 },
  title: { min: 16, recommendedMin: 22, recommendedMax: 30, max: 36, default: 26 },
  subtitle: { min: 10, recommendedMin: 14, recommendedMax: 18, max: 22, default: 16 },
  author: { min: 10, recommendedMin: 14, recommendedMax: 18, max: 22, default: 16 },
  year: { min: 10, recommendedMin: 12, recommendedMax: 16, max: 20, default: 14 },
  custom: { min: 10, recommendedMin: 12, recommendedMax: 20, max: 26, default: 16 }
};

export const roleTypography: Record<EmbossingTextRole, {
  preferredPt: number;
  minPt: number;
  maxPt: number;
  lineHeight: number;
  uppercase: boolean;
  maxLines: number;
  spacingAfterMm: number;
  maxWidthRatio: number;
}> = {
  institution: { preferredPt: embossingFontRules.institution.default, minPt: embossingFontRules.institution.min, maxPt: embossingFontRules.institution.max, lineHeight: 1.26, uppercase: true, maxLines: 2, spacingAfterMm: 12, maxWidthRatio: 0.62 },
  workType: { preferredPt: embossingFontRules.workType.default, minPt: embossingFontRules.workType.min, maxPt: embossingFontRules.workType.max, lineHeight: 1.2, uppercase: true, maxLines: 1, spacingAfterMm: 12, maxWidthRatio: 0.62 },
  title: { preferredPt: embossingFontRules.title.default, minPt: embossingFontRules.title.min, maxPt: embossingFontRules.title.max, lineHeight: 1.24, uppercase: true, maxLines: 3, spacingAfterMm: 8, maxWidthRatio: 0.68 },
  subtitle: { preferredPt: embossingFontRules.subtitle.default, minPt: embossingFontRules.subtitle.min, maxPt: embossingFontRules.subtitle.max, lineHeight: 1.24, uppercase: false, maxLines: 2, spacingAfterMm: 7, maxWidthRatio: 0.64 },
  author: { preferredPt: embossingFontRules.author.default, minPt: embossingFontRules.author.min, maxPt: embossingFontRules.author.max, lineHeight: 1.22, uppercase: false, maxLines: 2, spacingAfterMm: 8, maxWidthRatio: 0.58 },
  year: { preferredPt: embossingFontRules.year.default, minPt: embossingFontRules.year.min, maxPt: embossingFontRules.year.max, lineHeight: 1.22, uppercase: false, maxLines: 1, spacingAfterMm: 0, maxWidthRatio: 0.32 },
  custom: { preferredPt: embossingFontRules.custom.default, minPt: embossingFontRules.custom.min, maxPt: embossingFontRules.custom.max, lineHeight: 1.22, uppercase: false, maxLines: 1, spacingAfterMm: 5, maxWidthRatio: 0.62 }
};

export function getEmbossingFontRule(role: EmbossingTextRole) {
  return embossingFontRules[role];
}

const standardFonts = {
  modern: {
    regular: Font.load(FontNames.Helvetica),
    bold: Font.load(FontNames.HelveticaBold)
  },
  classic: {
    regular: Font.load(FontNames.TimesRoman),
    bold: Font.load(FontNames.TimesRomanBold)
  }
} as const;

function glyphName(char: string) {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return undefined;
  if (!Encodings.WinAnsi.canEncodeUnicodeCodePoint(codePoint)) return undefined;
  return Encodings.WinAnsi.encodeUnicodeCodePoint(codePoint).name;
}

function fontFor(fontStyle: FontStyle, fontWeight: number) {
  return fontWeight >= 600 ? standardFonts[fontStyle].bold : standardFonts[fontStyle].regular;
}

export function textWidthMm(text: string, fontSizePt: number, fontStyle: FontStyle, fontWeight = 500, letterSpacingMm = 0) {
  const font = fontFor(fontStyle, fontWeight);
  let units = 0;
  let previousGlyph: string | undefined;
  const chars = Array.from(text);

  for (const char of chars) {
    const currentGlyph = glyphName(char);
    if (previousGlyph && currentGlyph) {
      units += font.getXAxisKerningForPair(previousGlyph, currentGlyph) ?? 0;
    }
    units += currentGlyph ? font.getWidthOfGlyph(currentGlyph) ?? 0 : 600;
    previousGlyph = currentGlyph;
  }

  const tracking = Math.max(0, chars.length - 1) * letterSpacingMm;
  return (units / 1000) * fontSizePt * PT_TO_MM + tracking;
}

export function fontSizeMm(fontSizePt: number) {
  return fontSizePt * PT_TO_MM;
}

export function lineHeightMm(fontSizePt: number, role: EmbossingTextRole) {
  return fontSizePt * PT_TO_MM * roleTypography[role].lineHeight;
}

export function normalizeRoleText(text: string, role: EmbossingTextRole) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return roleTypography[role].uppercase ? normalized.toLocaleUpperCase("de-AT") : normalized;
}

function splitLongWord(word: string, params: { fontSizePt: number; maxWidthMm: number; fontStyle: FontStyle; fontWeight: number; letterSpacingMm: number }) {
  const parts: string[] = [];
  let current = "";
  for (const char of Array.from(word)) {
    const candidate = `${current}${char}`;
    if (!current || textWidthMm(candidate, params.fontSizePt, params.fontStyle, params.fontWeight, params.letterSpacingMm) <= params.maxWidthMm) {
      current = candidate;
      continue;
    }
    parts.push(current);
    current = char;
  }
  if (current) parts.push(current);
  return parts;
}

export function wrapTextToWidth(params: {
  text: string;
  fontSizePt: number;
  maxWidthMm: number;
  fontStyle: FontStyle;
  fontWeight: number;
  letterSpacingMm: number;
}) {
  const words = params.text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const rawWord of words) {
    const wordParts = textWidthMm(rawWord, params.fontSizePt, params.fontStyle, params.fontWeight, params.letterSpacingMm) > params.maxWidthMm
      ? splitLongWord(rawWord, params)
      : [rawWord];

    for (const word of wordParts) {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || textWidthMm(candidate, params.fontSizePt, params.fontStyle, params.fontWeight, params.letterSpacingMm) <= params.maxWidthMm) {
        current = candidate;
        continue;
      }
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export function measureEmbossingText(params: {
  text: string;
  role: EmbossingTextRole;
  fontSizePt: number;
  maxWidthMm: number;
  fontStyle: FontStyle;
  fontWeight: number;
  letterSpacingMm?: number;
}) {
  const letterSpacingMm = params.letterSpacingMm ?? 0;
  const lines = wrapTextToWidth({
    text: params.text,
    fontSizePt: params.fontSizePt,
    maxWidthMm: params.maxWidthMm,
    fontStyle: params.fontStyle,
    fontWeight: params.fontWeight,
    letterSpacingMm
  });
  const widths = lines.map((line) => textWidthMm(line, params.fontSizePt, params.fontStyle, params.fontWeight, letterSpacingMm));
  const lineHeight = lineHeightMm(params.fontSizePt, params.role);
  return {
    lines,
    widthMm: Math.max(...widths, 0),
    heightMm: lines.length * lineHeight,
    lineHeightMm: lineHeight,
    letterSpacingMm,
    fitsWidth: widths.every((width) => width <= params.maxWidthMm + 0.01),
    fitsLineCount: lines.length <= roleTypography[params.role].maxLines
  };
}

export function calculateMaximumFontSizeThatFits(params: {
  text: string;
  role: EmbossingTextRole;
  maxWidthMm: number;
  maxHeightMm: number;
  fontStyle: FontStyle;
  fontWeight: number;
}) {
  const rule = getEmbossingFontRule(params.role);
  const normalized = normalizeRoleText(params.text, params.role);
  if (!normalized) return rule.max;
  for (let fontSizePt = rule.max; fontSizePt >= rule.min; fontSizePt -= 1) {
    const measured = measureEmbossingText({
      text: normalized,
      role: params.role,
      fontSizePt,
      maxWidthMm: params.maxWidthMm,
      fontStyle: params.fontStyle,
      fontWeight: params.fontWeight
    });
    if (measured.fitsWidth && measured.fitsLineCount && measured.heightMm <= params.maxHeightMm + 0.01) {
      return fontSizePt;
    }
  }
  return rule.min;
}

export function getEffectiveFontSizeRange(params: {
  text: string;
  role: EmbossingTextRole;
  maxWidthMm: number;
  maxHeightMm: number;
  fontStyle: FontStyle;
  fontWeight: number;
}) {
  const rule = getEmbossingFontRule(params.role);
  const effectiveMax = Math.max(rule.min, Math.min(rule.max, calculateMaximumFontSizeThatFits(params)));
  const recommendedMax = Math.min(rule.recommendedMax, effectiveMax);
  const recommendedMin = Math.min(rule.recommendedMin, recommendedMax);
  return {
    min: rule.min,
    max: effectiveMax,
    designMax: rule.max,
    default: Math.min(rule.default, effectiveMax),
    recommendedMin,
    recommendedMax
  };
}

export function fitTextBlock(params: {
  text: string;
  role: EmbossingTextRole;
  minFontSizePt: number;
  preferredFontSizePt?: number;
  maxFontSizePt?: number;
  maxWidthMm: number;
  maxLines?: number;
  fontStyle: FontStyle;
  fontWeight: number;
}) {
  const roleStyle = roleTypography[params.role];
  const minPt = Math.max(params.minFontSizePt, roleStyle.minPt);
  const maxPt = Math.max(minPt, params.maxFontSizePt ?? roleStyle.maxPt);
  const preferred = Math.min(maxPt, Math.max(minPt, params.preferredFontSizePt ?? roleStyle.preferredPt));
  const maxLines = params.maxLines ?? roleStyle.maxLines;
  const trackingStepsMm = [0.06, 0.035, 0.015, 0];

  for (let fontSizePt = preferred; fontSizePt >= minPt; fontSizePt -= 0.25) {
    for (const letterSpacingMm of trackingStepsMm) {
      const lines = wrapTextToWidth({
        text: params.text,
        fontSizePt,
        maxWidthMm: params.maxWidthMm,
        fontStyle: params.fontStyle,
        fontWeight: params.fontWeight,
        letterSpacingMm
      });
      const widths = lines.map((line) => textWidthMm(line, fontSizePt, params.fontStyle, params.fontWeight, letterSpacingMm));
      if (lines.length <= maxLines && widths.every((width) => width <= params.maxWidthMm)) {
        return {
          ok: true as const,
          lines,
          fontSizePt,
          letterSpacingMm,
          widthMm: Math.max(...widths, 0),
          lineHeightMm: lineHeightMm(fontSizePt, params.role)
        };
      }
    }
  }

  const lines = wrapTextToWidth({
    text: params.text,
    fontSizePt: minPt,
    maxWidthMm: params.maxWidthMm,
    fontStyle: params.fontStyle,
    fontWeight: params.fontWeight,
    letterSpacingMm: 0
  });
  return {
    ok: false as const,
    lines,
    fontSizePt: minPt,
    letterSpacingMm: 0,
    widthMm: Math.max(...lines.map((line) => textWidthMm(line, minPt, params.fontStyle, params.fontWeight, 0)), 0),
    lineHeightMm: lineHeightMm(minPt, params.role),
    message: "Dieser Text ist zu lang für eine sichere Prägung. Bitte kürze den Text oder verwende eine zusätzliche Zeile."
  };
}
