export const EMBOSSING_LAYOUT_VERSION = 1;

export type EmbossingColor = "gold" | "silber" | "blind";
export type EmbossingTemplate = "classic" | "modern" | "minimal" | "logo";
export type EmbossingTextRole = "institution" | "workType" | "title" | "subtitle" | "author" | "year" | "custom";
export type EmbossingElementType = "text" | "logo";
export type EmbossingAlignment = "left" | "center" | "right";

export type CoverGeometry = {
  widthMm: number;
  heightMm: number;
  safeArea: {
    topMm: number;
    rightMm: number;
    bottomMm: number;
    leftMm: number;
  };
};

export type EmbossingProductionRules = {
  minFontSizePt: number;
  minPositiveStrokeMm: number;
  minNegativeGapMm: number;
  minGroupSeparationMm: number;
  maxLogoWidthRatio: number;
  maxLogoHeightMm: number;
  maxCustomLines: number;
};

export type EmbossingSourceContent = {
  institution?: string;
  workType?: string;
  title?: string;
  subtitle?: string;
  author?: string;
  year?: string;
  customLines?: string[];
  fontSizeOverrides?: Partial<Record<EmbossingTextRole, number>>;
  customFontSizeOverrides?: number[];
  use?: Partial<Record<EmbossingTextRole, boolean>>;
  logo?: {
    url: string;
    name?: string;
    mimeType?: string;
    widthMm?: number;
    heightMm?: number;
  };
  coverUpload?: {
    url: string;
    name?: string;
    mimeType?: string;
    lineCount?: number;
    extractedLines?: string[];
    analysisMessage?: string;
  };
};

export type EmbossingTextElement = {
  type: "text";
  role: EmbossingTextRole;
  text: string;
  lines: string[];
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  fontSizePt: number;
  lineHeightMm: number;
  letterSpacingMm: number;
  alignment: EmbossingAlignment;
  fontStyle: "modern" | "classic";
  weight: number;
  zone: "top" | "middle" | "bottom";
};

export type EmbossingLogoElement = {
  type: "logo";
  role: "custom";
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  zone: "top" | "middle" | "bottom";
  url: string;
};

export type EmbossingLayoutElement = EmbossingTextElement | EmbossingLogoElement;

export type EmbossingResolvedLayout = {
  layoutVersion: number;
  template: EmbossingTemplate;
  fontStyle: "modern" | "classic";
  coverGeometry: CoverGeometry;
  elements: EmbossingLayoutElement[];
  lineCount: number;
  corrections: string[];
  warnings: string[];
};

export type GenerateEmbossingLayoutInput = {
  coverGeometry: CoverGeometry;
  sourceContent: EmbossingSourceContent;
  template: EmbossingTemplate;
  fontStyle?: "modern" | "classic";
  productionRules?: Partial<EmbossingProductionRules>;
  advancedAdjustments?: Partial<Record<"top" | "middle" | "bottom", { offsetYMm?: number; alignment?: EmbossingAlignment }>>;
};

export const defaultCoverGeometry: CoverGeometry = {
  widthMm: 210,
  heightMm: 297,
  safeArea: {
    topMm: 20,
    rightMm: 20,
    bottomMm: 20,
    leftMm: 20
  }
};

export const defaultEmbossingProductionRules: EmbossingProductionRules = {
  minFontSizePt: 10,
  minPositiveStrokeMm: 0.25,
  minNegativeGapMm: 0.35,
  minGroupSeparationMm: 8,
  maxLogoWidthRatio: 0.3,
  maxLogoHeightMm: 32,
  maxCustomLines: 3
};
