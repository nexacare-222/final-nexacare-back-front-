import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { createCareEventSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeCareEvent } from '@/lib/serializers';

export const GET = withAuth(async (_request, _ctx, session) => {
  const where = session.role === 'PATIENT_PARTY'
    ? { patientId: session.linkedPatientId ?? '__none__' }
    : {};
  const events = await prisma.careEvent.findMany({ where, orderBy: { timestamp: 'desc' } });
  return NextResponse.json({ careEvents: events.map(serializeCareEvent) });
});

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(createCareEventSchema, body);

      const event = await prisma.careEvent.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId ?? session.userId,
          nurseId: data.nurseId,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          priority: data.priority,
          status: data.status ?? 'PENDING',
          notes: data.notes,
          checks: data.checks,
          medications: data.medications as any,
          scheduledTimes: data.scheduledTimes ?? [],
          checklist: data.checklist as any,
        },
      });

      const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
      await prisma.notification.create({
        data: {
          userId: data.nurseId,
          title: 'New Task Assigned',
          message: `New ${data.priority} task for ${patient?.name ?? 'Patient'}`,
          type: 'TASK_ASSIGNED',
          patientId: data.patientId,
        },
      });

      await recordAudit({
        userId: session.userId,
        action: 'CARE_EVENT_CREATE',
        resourceType: 'CareEvent',
        resourceId: event.id,
        metadata: { patientId: data.patientId },
        ...meta,
      });

      return NextResponse.json({ careEvent: serializeCareEvent(event) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[care-events] create error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'ADMIN'] },
);
