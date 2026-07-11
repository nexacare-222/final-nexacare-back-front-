import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { updateStaffSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeUser } from '@/lib/serializers';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const PATCH = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id } = await ctx.params;
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(updateStaffSchema, body);

      const user = await prisma.user.update({ where: { id }, data });

      await recordAudit({
        userId: session.userId,
        action: 'STAFF_UPDATE',
        resourceType: 'User',
        resourceId: id,
        ...meta,
      });

      return NextResponse.json({ staff: serializeUser(user) });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[staff/:id] update error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);

export const DELETE = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id } = await ctx.params;
    const meta = requestMeta(request);
    try {
      // Deactivate rather than hard-delete: preserves referential integrity
      // for any patients/care-events/audit rows that still point at this
      // user, and keeps a paper trail for compliance.
      await prisma.user.update({ where: { id }, data: { status: 'DEACTIVATED' } });

      await recordAudit({
        userId: session.userId,
        action: 'STAFF_DEACTIVATE',
        resourceType: 'User',
        resourceId: id,
        ...meta,
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[staff/:id] delete error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
