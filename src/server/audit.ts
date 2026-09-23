import { createHash } from "node:crypto";
import { db } from "@/server/db";

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function auditData(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before?: unknown;
  after?: unknown;
}) {
  return {
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    beforeHash: digest(input.before ?? null),
    afterHash: digest(input.after ?? null),
  };
}

export async function writeAudit(input: Parameters<typeof auditData>[0]) {
  await db.auditEvent.create({ data: auditData(input) });
}
