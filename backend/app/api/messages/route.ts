import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { createMessageSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeChatMessage } from '@/lib/serializers';

/**
 * Returns every message the caller is allowed to see, grouped by patientId
 * — matches the frontend's `Record<patientId, ChatMessage[]>` store shape
 * so the whole `messages` slice can be hydrated in one round trip.
 */
export const GET = withAuth(async (_request, _ctx, session) => {
  const where = session.role === 'PATIENT_PARTY'
    ? { patientId: session.linkedPatientId ?? '__none__' }
    : {};
  const rows = await prisma.chatMessage.findMany({ where, orderBy: { timestamp: 'asc' } });

  const grouped: Record<string, ReturnType<typeof serializeChatMessage>[]> = {};
  for (const row of rows) {
    (grouped[row.patientId] ??= []).push(serializeChatMessage(row));
  }
  return NextResponse.json({ messages: grouped });
});

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(createMessageSchema, body);

      const sender = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!sender) {
        return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
      }

      const message = await prisma.chatMessage.create({
        data: {
          patientId: data.patientId,
          senderId: session.userId,
          senderName: sender.name,
          senderRole: session.role,
          content: data.content,
          isAttachment: data.isAttachment ?? false,
          attachmentType: data.attachmentType,
          channel: data.channel ?? 'TEAM',
        },
      });

      await recordAudit({
        userId: session.userId,
        action: 'MESSAGE_SEND',
        resourceType: 'ChatMessage',
        resourceId: message.id,
        metadata: { patientId: data.patientId },
        ...meta,
      });

      return NextResponse.json({ message: serializeChatMessage(message) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[messages] send error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PATIENT_PARTY'] },
);
