import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { completeCareEventSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeCareEvent } from '@/lib/serializers';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const PATCH = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id } = await ctx.params;
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const { nurseNotes, checklist, attachments } = parseOrThrow(completeCareEventSchema, body);

      const event = await prisma.careEvent.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          nurseNotes,
          checklist: checklist as any,
          attachments,
        },
      });

      await recordAudit({
        userId: session.userId,
        action: 'CARE_EVENT_COMPLETE',
        resourceType: 'CareEvent',
        resourceId: id,
        ...meta,
      });

      return NextResponse.json({ careEvent: serializeCareEvent(event) });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[care-events/:id/complete] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['NURSE', 'STAFF', 'ADMIN'] },
);
