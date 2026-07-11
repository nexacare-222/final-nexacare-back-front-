import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { updateSelfSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

export const GET = withAuth(async (_request, _ctx, session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      linkedPatientId: true,
      avatar: true,
      department: true,
      specialization: true,
      isOnline: true,
      // passwordHash is never selected here even though the global omit
      // would already exclude it — belt and suspenders.
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Session no longer valid' }, { status: 401 });
  }

  return NextResponse.json({ user });
});

/** Lets a logged-in user edit their own display fields (name/phone/avatar/etc). */
export const PATCH = withAuth(async (request, _ctx, session) => {
  const meta = requestMeta(request);
  try {
    const body = await request.json().catch(() => null);
    const data = parseOrThrow(updateSelfSchema, body);

    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        linkedPatientId: true,
        avatar: true,
        department: true,
        specialization: true,
        isOnline: true,
      },
    });

    await recordAudit({ userId: session.userId, action: 'PROFILE_UPDATE', ...meta });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[auth/me] update error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
