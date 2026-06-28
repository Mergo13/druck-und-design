import { NextResponse } from "next/server";
import { getClientLogos, saveClientLogos } from "@/lib/catalog-repository";

export async function GET() {
  return NextResponse.json(await getClientLogos());
}

export async function PUT(request: Request) {
  const body = await request.json() as { logos?: string[] };
  return NextResponse.json(await saveClientLogos(body.logos ?? []));
}
