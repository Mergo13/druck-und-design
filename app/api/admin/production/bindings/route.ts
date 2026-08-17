import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin-audit";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { defaultProductionBindingConfig, getProductionBindingConfig, saveProductionBindingConfig } from "@/lib/production-binding-config";

const configSchema = z.object({
  bindingSystems: z.array(z.record(z.string(), z.unknown())).min(1),
  bindingVariants: z.array(z.record(z.string(), z.unknown())),
  updatedAt: z.string().optional()
});

export async function GET() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "view");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  return NextResponse.json(await getProductionBindingConfig());
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const body = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Produktionsdaten.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const saved = await saveProductionBindingConfig(parsed.data as any);
  await writeAuditLog({
    actorEmail: permission.sessionUser.email,
    module: "products",
    action: "production-binding-config-update",
    payload: {
      bindingSystems: saved.bindingSystems.length,
      bindingVariants: saved.bindingVariants.length
    }
  });
  return NextResponse.json(saved);
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const body = await request.json().catch(() => null) as { reset?: boolean } | null;
  if (!body?.reset) return NextResponse.json({ message: "Unbekannte Aktion." }, { status: 400 });
  const saved = await saveProductionBindingConfig(defaultProductionBindingConfig());
  await writeAuditLog({
    actorEmail: permission.sessionUser.email,
    module: "products",
    action: "production-binding-config-reset"
  });
  return NextResponse.json(saved);
}
