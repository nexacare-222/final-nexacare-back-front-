import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { movementSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
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
      const { toLocation, reason, timeString, assignedStaffId } = parseOrThrow(movementSchema, body);

      let timestamp = new Date();
      if (timeString) {
        const [h, m] = timeString.split(':').map(Number);
        if (!Number.isNaN(h) && h !== undefined) {
          timestamp = new Date();
          timestamp.setHours(h, m ?? 0, 0, 0);
        }
      }

      let assignedStaff = null;
      if (assignedStaffId) {
        assignedStaff = await prisma.user.findUnique({ where: { id: assignedStaffId } });
      }

      const updatedPatient = await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
          throw new Error('Patient not found');
        }

        const updatedTimings = {
          ...((patient.assignmentTimings as Record<string, string> | null) ?? {}),
          ...(assignedStaffId && timeString ? { [assignedStaffId]: timeString } : {}),
        };

        await tx.movementLog.create({
          data: {
            patientId,
            fromLocation: patient.currentLocation,
            toLocation,
            movedByAdminId: session.userId,
            timestamp,
            reason,
          },
        });

        const p = await tx.patient.update({
          where: { id: patientId },
          data: {
            currentLocation: toLocation,
            assignmentTimings: updatedTimings,
            ...(assignedStaff && (assignedStaff.role === 'NURSE' || assignedStaff.role === 'STAFF')
              ? { assignedNurses: { connectOrCreate: { where: { patientId_nurseId: { patientId, nurseId: assignedStaffId! } }, create: { nurseId: assignedStaffId! } } } }
              : {}),
          },
          include: patientInclude,
        });

        // Audit inside transaction so failure aborts the move
        await recordAudit({
          userId: session.userId,
          action: 'PATIENT_MOVEMENT',
          resourceType: 'Patient',
          resourceId: patientId,
          metadata: { toLocation, reason },
          ...meta,
        });

        return p;
      });

      if (assignedStaffId) {
        await prisma.notification.create({
          data: {
            userId: assignedStaffId,
            title: 'Patient Transfer Assignment',
            message: `You have been assigned to ${updatedPatient.name} during transfer to ${toLocation}. Reason: ${reason}`,
            type: 'ALERT',
            patientId,
          },
        });
      }

      return NextResponse.json({ patient: serializePatient(updatedPatient) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      if (error instanceof Error && error.message === 'Patient not found') {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/:id/movements] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
