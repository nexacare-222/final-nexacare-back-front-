import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { assignStaffSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
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

export const POST = withAuth<Ctx>(
  async (request, ctx, session) => {
    const { id: patientId } = await ctx.params;
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const { staffId, role, time } = parseOrThrow(assignStaffSchema, body);

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      const updatedTimings = {
        ...((patient.assignmentTimings as Record<string, string> | null) ?? {}),
        [staffId]: time,
      };

      let updatedPatient;
      if (role === 'DOCTOR') {
        updatedPatient = await prisma.patient.update({
          where: { id: patientId },
          data: { assignedDoctorId: staffId, assignmentTimings: updatedTimings },
          include: patientInclude,
        });
      } else {
        updatedPatient = await prisma.patient.update({
          where: { id: patientId },
          data: {
            assignmentTimings: updatedTimings,
            assignedNurses: {
              connectOrCreate: {
                where: { patientId_nurseId: { patientId, nurseId: staffId } },
                create: { nurseId: staffId, timing: time as any },
              },
            },
          },
          include: patientInclude,
        });
      }

      if (role === 'NURSE' || role === 'STAFF') {
        await prisma.notification.create({
          data: {
            userId: staffId,
            title: 'New Patient Assignment',
            message: `You have been assigned to patient ${patient.name}. Report time: ${time}.`,
            type: 'TASK_ASSIGNED',
            patientId,
          },
        });
      }

      await recordAudit({
        userId: session.userId,
        action: 'PATIENT_ASSIGN_STAFF',
        resourceType: 'Patient',
        resourceId: patientId,
        metadata: { staffId, role, time },
        ...meta,
      });

      return NextResponse.json({ patient: serializePatient(updatedPatient) });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/:id/assign] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
