import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { serializeNotification } from '@/lib/serializers';

export const GET = withAuth(async (_request, _ctx, session) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  return NextResponse.json({ notifications: notifications.map(serializeNotification) });
});
