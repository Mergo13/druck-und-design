import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getGlobalProperties, upsertGlobalProperty } from "@/lib/catalog-repository";
import type { GlobalProperty } from "@/types/print-platform";

export async function GET() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "view");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  return NextResponse.json(await getGlobalProperties());
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as GlobalProperty & { originalSlug?: string };
  const existing = (await getGlobalProperties()).some((item) => item.slug === (body.originalSlug || body.slug));
  const permission = await requireModulePermission("products", existing ? "update" : "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { originalSlug, ...property } = body;
  if (!property.name) {
    return NextResponse.json({ message: "Name ist ein Pflichtfeld." }, { status: 400 });
  }
  return NextResponse.json(await upsertGlobalProperty(property, originalSlug));
}
