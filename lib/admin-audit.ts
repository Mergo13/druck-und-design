import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  actorEmail?: string;
  module: string;
  action: string;
  entityId?: string;
  payload?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorEmail: input.actorEmail,
      module: input.module,
      action: input.action,
      entityId: input.entityId,
      payload: input.payload as object | undefined
    }
  });
}
