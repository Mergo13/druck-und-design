import { NextResponse } from "next/server";
import { createAutomationJobs } from "@/lib/print-workflow";
import { publishWorkflowEvent } from "@/lib/infra/events";
import { enqueueWorkflowJobs } from "@/lib/infra/queue";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const body = (await request.json()) as { projectId?: string };
  const projectId = body.projectId ?? `projekt-${Date.now()}`;
  const jobs = createAutomationJobs(projectId);

  const queuedJobs = await enqueueWorkflowJobs(projectId);
  const eventPublished = await publishWorkflowEvent("workflow.created", { projectId, jobs: jobs.length });
  logger.info({ projectId, queuedJobs: queuedJobs.length, eventPublished }, "Workflow created");

  return NextResponse.json({
    projectId,
    jobs,
    runtime: {
      queueEnabled: queuedJobs.length > 0,
      queuedJobs,
      eventPublished
    }
  });
}
