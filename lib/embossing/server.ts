import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbossingLayout } from "./layout";
import { defaultCoverGeometry, defaultEmbossingProductionRules } from "./types";
import type { EmbossingColor, EmbossingTemplate } from "./types";

export const embossingSourceSchema = z.object({
  institution: z.string().max(200).optional(),
  workType: z.string().max(80).optional(),
  title: z.string().max(500).optional(),
  subtitle: z.string().max(300).optional(),
  author: z.string().max(160).optional(),
  year: z.string().max(20).optional(),
  customLines: z.array(z.string().max(160)).max(defaultEmbossingProductionRules.maxCustomLines).optional(),
  use: z.record(z.string(), z.boolean()).optional(),
  logo: z.object({
    url: z.string().max(500),
    name: z.string().max(200).optional(),
    mimeType: z.string().max(120).optional(),
    widthMm: z.number().positive().max(200).optional(),
    heightMm: z.number().positive().max(200).optional()
  }).optional(),
  coverUpload: z.object({
    url: z.string().max(500),
    name: z.string().max(200).optional(),
    mimeType: z.string().max(120).optional(),
    lineCount: z.number().int().min(0).max(40).optional(),
    extractedLines: z.array(z.string().max(220)).max(40).optional(),
    analysisMessage: z.string().max(300).optional()
  }).optional()
});

export const embossingDesignPayloadSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1).max(160),
  configurationId: z.string().max(300).optional(),
  embossingColor: z.enum(["gold", "silber", "blind"]).default("gold"),
  template: z.enum(["classic", "modern", "minimal", "logo"]).default("classic"),
  fontStyle: z.enum(["modern", "classic"]).default("modern"),
  coverGeometry: z.object({
    widthMm: z.number().positive().max(600),
    heightMm: z.number().positive().max(600),
    safeArea: z.object({
      topMm: z.number().min(0).max(100),
      rightMm: z.number().min(0).max(100),
      bottomMm: z.number().min(0).max(100),
      leftMm: z.number().min(0).max(100)
    })
  }).default(defaultCoverGeometry),
  sourceContent: embossingSourceSchema.default({}),
  advancedAdjustments: z.record(z.string(), z.object({
    offsetYMm: z.number().min(-50).max(50).optional(),
    alignment: z.enum(["left", "center", "right"]).optional()
  })).optional()
});

export async function requireEmbossingUser() {
  const session = await getSessionUser();
  if (!session?.id || !session.email) {
    return { ok: false as const, error: { message: "Nicht authentifiziert.", status: 401 } };
  }
  return { ok: true as const, session };
}

export async function findOwnedEmbossingDesign(id: string, userId: string) {
  const design = await (prisma as any).embossingDesign.findFirst({
    where: { id, userId }
  });
  return design as any | null;
}

export function resolveLayoutFromPayload(payload: z.infer<typeof embossingDesignPayloadSchema>) {
  return generateEmbossingLayout({
    coverGeometry: payload.coverGeometry,
    sourceContent: payload.sourceContent,
    template: payload.template as EmbossingTemplate,
    fontStyle: payload.fontStyle,
    advancedAdjustments: payload.advancedAdjustments as any,
    productionRules: defaultEmbossingProductionRules
  });
}

export function embossingColorFromPraegungValue(value?: string): EmbossingColor {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("silber")) return "silber";
  if (normalized.includes("blind")) return "blind";
  return "gold";
}
