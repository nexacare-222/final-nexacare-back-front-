import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { updatePatientSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializePatient } from '@/lib/serializers';

const patientInclude = {
  assignedNurses: true,
  movements: true,
  vitals: true,
  dischargeDetails: true,
} as const;

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withAuth<Ctx>(async (_request, ctx, session) => {
  const { id } = await ctx.params;

  if (session.role === 'PATIENT_PARTY' && session.linkedPatientId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patient = await prisma.patient.findUnique({ where: { id }, include: patientInclude });
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }
  return NextResponse.json({ patient: serializePatient(patient) });
});

export const PATCH = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id } = await ctx.params;
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(updatePatientSchema, body);

      const patient = await prisma.patient.update({
        where: { id },
        data: data as any,
        include: patientInclude,
      });

      await recordAudit({
        userId: session.userId,
        action: 'PATIENT_UPDATE',
        resourceType: 'Patient',
        resourceId: id,
        ...meta,
      });

      return NextResponse.json({ patient: serializePatient(patient) });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/:id] update error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN', 'DOCTOR'] },
);
