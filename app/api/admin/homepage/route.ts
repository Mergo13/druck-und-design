import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin-audit";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getHomepageSettings, upsertHomepageSettings } from "@/lib/homepage-settings";

const homepageSettingsSchema = z.object({
  bestsellerEnabled: z.boolean(),
  bestsellerTitle: z.string().min(1),
  bestsellerSubtitle: z.string().min(1),
  bestsellerSortOrder: z.number(),
  studentShopEnabled: z.boolean(),
  studentShopTitle: z.string().min(1),
  studentShopDescription: z.string().min(1),
  studentShopImage: z.string().optional().default(""),
  studentShopLink: z.string().min(1),
  studentShopSortOrder: z.number(),
  googleReviewsEnabled: z.boolean(),
  googleReviewsTitle: z.string().min(1),
  googleReviewsSubtitle: z.string().min(1),
  googleReviewsSortOrder: z.number()
});

export async function GET() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "view");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  return NextResponse.json(await getHomepageSettings());
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const body = await request.json().catch(() => null);
  const parsed = homepageSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  const settings = await upsertHomepageSettings(parsed.data);
  await writeAuditLog({
    actorEmail: permission.sessionUser.email,
    module: "usersRoles",
    action: "homepage-settings-update",
    entityId: "homepage",
    payload: parsed.data
  });
  return NextResponse.json(settings);
}
