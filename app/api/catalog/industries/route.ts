import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getIndustries, getPublicIndustries, upsertIndustry } from "@/lib/catalog-repository";
import type { ProductIndustry } from "@/types/print-platform";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("industries", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    return NextResponse.json(await getIndustries());
  }
  return NextResponse.json(await getPublicIndustries());
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as ProductIndustry & { originalSlug?: string };
  const existing = (await getIndustries()).some((item) => item.slug === (body.originalSlug || body.slug));
  const permission = await requireModulePermission("industries", existing ? "update" : "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { originalSlug, ...industry } = body;
  if (!industry.name) {
    return NextResponse.json({ message: "Name ist ein Pflichtfeld." }, { status: 400 });
  }
  return NextResponse.json(await upsertIndustry(industry, originalSlug));
}
