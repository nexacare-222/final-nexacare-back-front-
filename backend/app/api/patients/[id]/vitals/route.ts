import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { vitalsSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeVitals } from '@/lib/serializers';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const POST = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id: patientId } = await ctx.params;
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(vitalsSchema, body);

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      const reading = await prisma.vitalsReading.create({
        data: { ...data, patientId, trend: 'STABLE', recordedBy: session.userId },
      });

      await recordAudit({
        userId: session.userId,
        action: 'VITALS_RECORDED',
        resourceType: 'Patient',
        resourceId: patientId,
        ...meta,
      });

      return NextResponse.json({ vitals: serializeVitals(reading) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/:id/vitals] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN'] },
);
