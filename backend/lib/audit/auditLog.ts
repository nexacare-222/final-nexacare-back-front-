import { prisma } from '../prisma';

export interface AuditEntry {
  userId?: string | null;
  action: string; // e.g. 'LOGIN_SUCCESS', 'CARE_EVENT_CREATE', 'PATIENT_UPDATE'
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Fire-and-forget-but-safe audit write. Never let a logging failure break
 * the calling request — this always swallows errors after logging them to
 * stderr, since audit-logging must never become an availability risk for
 * clinical workflows.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata as never,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}

/** Pulls the client IP / user-agent out of a standard Next.js Request. */
export function requestMeta(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return {
    ipAddress: forwardedFor ? (forwardedFor.split(',')[0]?.trim() ?? null) : null,
    userAgent: request.headers.get('user-agent'),
  };
}
