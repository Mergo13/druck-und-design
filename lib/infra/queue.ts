import { Queue } from "bullmq";
import { getRedis } from "@/lib/infra/redis";

type WorkflowJob = {
  projectId: string;
  type: "preflight" | "render" | "erp-sync" | "nextcloud-upload";
};

let queue: Queue<WorkflowJob> | null = null;

export function getWorkflowQueue() {
  if (queue) return queue;
  const redis = getRedis();
  if (!redis) return null;

  queue = new Queue<WorkflowJob>("workflow-jobs", {
    connection: redis
  });
  return queue;
}

export async function enqueueWorkflowJobs(projectId: string) {
  const q = getWorkflowQueue();
  if (!q) return [];

  const jobs: WorkflowJob[] = [
    { projectId, type: "preflight" },
    { projectId, type: "render" },
    { projectId, type: "erp-sync" },
    { projectId, type: "nextcloud-upload" }
  ];

  const added = await Promise.all(
    jobs.map((job) => q.add(`${job.type}:${projectId}`, job, { removeOnComplete: true, removeOnFail: 200 }))
  );
  return added.map((item) => ({ id: item.id, name: item.name }));
}
