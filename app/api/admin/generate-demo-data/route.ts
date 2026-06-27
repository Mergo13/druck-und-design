import { NextResponse } from "next/server";
import { seedFromReactAdminDataGenerator } from "@/lib/catalog-repository";

export async function POST() {
  const result = await seedFromReactAdminDataGenerator();
  return NextResponse.json({ ok: true, ...result });
}
