import type { EmbossingTextRole } from "./types";

const PT_TO_MM = 25.4 / 72;

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

export const roleTypography: Record<EmbossingTextRole, {
  preferredPt: number;
  minPt: number;
  maxPt: number;
  lineHeight: number;
  uppercase: boolean;
  maxLines: number;
  spacingAfterMm: number;
}> = {
  institution: { preferredPt: 12, minPt: 10, maxPt: 13, lineHeight: 1.24, uppercase: true, maxLines: 2, spacingAfterMm: 7 },
  workType: { preferredPt: 18, minPt: 12, maxPt: 20, lineHeight: 1.18, uppercase: true, maxLines: 1, spacingAfterMm: 8 },
  title: { preferredPt: 17, minPt: 10, maxPt: 22, lineHeight: 1.22, uppercase: true, maxLines: 4, spacingAfterMm: 6 },
  subtitle: { preferredPt: 13, minPt: 10, maxPt: 14, lineHeight: 1.22, uppercase: false, maxLines: 2, spacingAfterMm: 5 },
  author: { preferredPt: 13, minPt: 10, maxPt: 15, lineHeight: 1.2, uppercase: false, maxLines: 1, spacingAfterMm: 5 },
  year: { preferredPt: 12, minPt: 10, maxPt: 13, lineHeight: 1.2, uppercase: false, maxLines: 1, spacingAfterMm: 0 },
  custom: { preferredPt: 12, minPt: 10, maxPt: 14, lineHeight: 1.2, uppercase: false, maxLines: 1, spacingAfterMm: 4 }
};

function charWidthFactor(char: string, fontStyle: "modern" | "classic") {
  if (char === " ") return 0.28;
  if ("ilI.,:;|'!".includes(char)) return fontStyle === "classic" ? 0.24 : 0.22;
  if ("mwMWÄÖÜ".includes(char)) return fontStyle === "classic" ? 0.86 : 0.82;
  if ("ABCDEFGHKNOPQRSTUVWXYZ".includes(char)) return fontStyle === "classic" ? 0.66 : 0.62;
  if ("0123456789".includes(char)) return 0.56;
  return fontStyle === "classic" ? 0.5 : 0.48;
}

export function textWidthMm(text: string, fontSizePt: number, fontStyle: "modern" | "classic") {
  const sum = Array.from(text).reduce((width, char) => width + charWidthFactor(char, fontStyle), 0);
  return sum * fontSizePt * PT_TO_MM;
}

export function lineHeightMm(fontSizePt: number, role: EmbossingTextRole) {
  return fontSizePt * PT_TO_MM * roleTypography[role].lineHeight;
}

export function normalizeRoleText(text: string, role: EmbossingTextRole) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return roleTypography[role].uppercase ? normalized.toLocaleUpperCase("de-AT") : normalized;
}

export function wrapTextToWidth(params: {
  text: string;
  fontSizePt: number;
  maxWidthMm: number;
  fontStyle: "modern" | "classic";
}) {
  const words = params.text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || textWidthMm(candidate, params.fontSizePt, params.fontStyle) <= params.maxWidthMm) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

export function fitTextBlock(params: {
  text: string;
  role: EmbossingTextRole;
  minFontSizePt: number;
  preferredFontSizePt?: number;
  maxFontSizePt?: number;
  maxWidthMm: number;
  maxLines?: number;
  fontStyle: "modern" | "classic";
}) {
  const roleStyle = roleTypography[params.role];
  const minPt = Math.max(params.minFontSizePt, roleStyle.minPt);
  const maxPt = Math.max(minPt, params.maxFontSizePt ?? roleStyle.maxPt);
  const preferred = Math.min(maxPt, Math.max(minPt, params.preferredFontSizePt ?? roleStyle.preferredPt));
  const maxLines = params.maxLines ?? roleStyle.maxLines;

  for (let fontSizePt = preferred; fontSizePt >= minPt; fontSizePt -= 0.5) {
    const lines = wrapTextToWidth({
      text: params.text,
      fontSizePt,
      maxWidthMm: params.maxWidthMm,
      fontStyle: params.fontStyle
    });
    if (lines.length <= maxLines && lines.every((line) => textWidthMm(line, fontSizePt, params.fontStyle) <= params.maxWidthMm)) {
      return {
        ok: true as const,
        lines,
        fontSizePt,
        widthMm: Math.max(...lines.map((line) => textWidthMm(line, fontSizePt, params.fontStyle)), 0),
        lineHeightMm: lineHeightMm(fontSizePt, params.role)
      };
    }
  }

  const lines = wrapTextToWidth({
    text: params.text,
    fontSizePt: minPt,
    maxWidthMm: params.maxWidthMm,
    fontStyle: params.fontStyle
  });
  return {
    ok: false as const,
    lines,
    fontSizePt: minPt,
    widthMm: Math.max(...lines.map((line) => textWidthMm(line, minPt, params.fontStyle)), 0),
    lineHeightMm: lineHeightMm(minPt, params.role),
    message: "Dieser Text ist zu lang für eine sichere Prägung. Bitte kürze den Text oder verwende eine zusätzliche Zeile."
  };
}
