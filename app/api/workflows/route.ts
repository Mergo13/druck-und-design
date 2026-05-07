import { NextResponse } from "next/server";
import { createAutomationJobs } from "@/lib/print-workflow";

export async function POST(request: Request) {
  const body = (await request.json()) as { projectId?: string };
  const projectId = body.projectId ?? `projekt-${Date.now()}`;
  return NextResponse.json({ projectId, jobs: createAutomationJobs(projectId) });
}
