import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { serializeNotification } from '@/lib/serializers';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const PATCH = withAuth<Ctx>(async (_request, ctx, session) => {
  const { id } = await ctx.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== session.userId) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ notification: serializeNotification(updated) });
});
