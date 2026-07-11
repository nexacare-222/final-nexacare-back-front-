import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { hashPassword } from '@/lib/auth/password';
import { createStaffSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeUser } from '@/lib/serializers';

export const GET = withAuth(async () => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN'] } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ staff: staff.map(serializeUser) });
});

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(createStaffSchema, body);

      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(data.password);
      const { password: _password, ...rest } = data;

      const user = await prisma.user.create({
        data: { ...rest, passwordHash },
      });

      await recordAudit({
        userId: session.userId,
        action: 'STAFF_CREATE',
        resourceType: 'User',
        resourceId: user.id,
        ...meta,
      });

      return NextResponse.json({ staff: serializeUser(user) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[staff] create error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
