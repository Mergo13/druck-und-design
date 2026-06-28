import { NextResponse } from "next/server";
import { seedFromReactAdminDataGenerator } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";

export async function POST() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Demo-Daten sind in Produktion deaktiviert." }, { status: 409 });
  }
  const result = await seedFromReactAdminDataGenerator();
  return NextResponse.json({ ok: true, ...result });
}
