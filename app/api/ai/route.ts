import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getUserByEmail } from "@/lib/catalog-repository";
import {
  applyCommerceCommand,
  commerceCatalogForModel,
  commerceStateInputSchema,
  createCommerceCatalogContext,
  synchronizeCommerceState
} from "@/lib/ai-commerce";
import { OllamaTimeoutError, requestOllamaCommerceCommand } from "@/lib/ollama";
import { prisma } from "@/lib/prisma";
import { aiCommerceDebug } from "@/lib/ai-commerce-debug";

const aiRequestSchema = z.object({
  mode: z.enum(["command", "sync"]).optional().default("command"),
  message: z.string().trim().max(2000).optional(),
  state: commerceStateInputSchema.optional().default({ activeItemId: null, items: [] })
}).strict().superRefine((value, context) => {
  if (value.mode === "command" && !value.message?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["message"], message: "Nachricht fehlt." });
  }
});

export async function POST(request: Request) {
  const parsed = aiRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Bitte geben Sie eine gültige Nachricht mit maximal 2.000 Zeichen ein." },
      { status: 400 }
    );
  }

  try {
    aiCommerceDebug("frontend-request", {
      mode: parsed.data.mode,
      message: parsed.data.message,
      state: parsed.data.state
    });
    const [catalog, session, storeControl] = await Promise.all([
      createCommerceCatalogContext(),
      getSessionUser().catch(() => null),
      prisma.storeControlSetting.findUnique({ where: { id: "store-control" } }).catch(() => null)
    ]);
    const account = session?.email ? await getUserByEmail(session.email).catch(() => null) : null;
    const auth = {
      authenticated: Boolean(session),
      user: account,
      studentDiscountPercent: storeControl?.studentDiscountPercent
    };

    if (parsed.data.mode === "sync") {
      const result = await synchronizeCommerceState(parsed.data.state, catalog, auth);
      aiCommerceDebug("frontend-response", result);
      return NextResponse.json(result);
    }

    const command = await requestOllamaCommerceCommand({
      message: parsed.data.message ?? "",
      catalog: commerceCatalogForModel(catalog),
      state: parsed.data.state
    });
    const result = await applyCommerceCommand(command, parsed.data.state, catalog, auth);
    aiCommerceDebug("frontend-response", result);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OllamaTimeoutError) {
      return NextResponse.json(
        { message: "Der Produktberater benötigt gerade zu lange. Bitte versuchen Sie es erneut." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { message: "Der Produktberater ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut." },
      { status: 503 }
    );
  }
}
