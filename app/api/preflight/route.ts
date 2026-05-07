import { NextResponse } from "next/server";
import { runMockPreflight } from "@/lib/print-workflow";

export async function POST(request: Request) {
  const body = (await request.json()) as { filename?: string };
  const filename = body.filename ?? "unbekannt.pdf";
  return NextResponse.json(runMockPreflight(filename));
}
