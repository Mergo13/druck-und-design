import { NextResponse } from "next/server";
import { getProductionBindingConfig } from "@/lib/production-binding-config";

export async function GET() {
  return NextResponse.json(await getProductionBindingConfig());
}
