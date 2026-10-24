import prisma from "./prisma";

interface AuditEntry {
  userId?: number;
  action: string;
  entityType: string;
  entityId: string | number;
  details?: Record<string, unknown>;
}

export async function recordAuditLog(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: String(entry.entityId),
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    });
  } catch (error) {
    // Audit failures should be visible without turning a completed workflow
    // action into an apparent failure for the user.
    console.error("Failed to record audit log:", error);
  }
}
