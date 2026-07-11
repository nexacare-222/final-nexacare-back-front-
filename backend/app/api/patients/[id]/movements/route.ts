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

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

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

      const updatedTimings = {
        ...((patient.assignmentTimings as Record<string, string> | null) ?? {}),
        ...(assignedStaffId && timeString ? { [assignedStaffId]: timeString } : {}),
      };

      const [, updatedPatient] = await prisma.$transaction([
        prisma.movementLog.create({
          data: {
            patientId,
            fromLocation: patient.currentLocation,
            toLocation,
            movedByAdminId: session.userId,
            timestamp,
            reason,
          },
        }),
        prisma.patient.update({
          where: { id: patientId },
          data: {
            currentLocation: toLocation,
            assignmentTimings: updatedTimings,
            ...(assignedStaff && (assignedStaff.role === 'NURSE' || assignedStaff.role === 'STAFF')
              ? { assignedNurses: { connectOrCreate: { where: { patientId_nurseId: { patientId, nurseId: assignedStaffId! } }, create: { nurseId: assignedStaffId! } } } }
              : {}),
          },
          include: patientInclude,
        }),
      ]);

      if (assignedStaffId) {
        await prisma.notification.create({
          data: {
            userId: assignedStaffId,
            title: 'Patient Transfer Assignment',
            message: `You have been assigned to ${patient.name} during transfer to ${toLocation}. Reason: ${reason}`,
            type: 'ALERT',
            patientId,
          },
        });
      }

      await recordAudit({
        userId: session.userId,
        action: 'PATIENT_MOVEMENT',
        resourceType: 'Patient',
        resourceId: patientId,
        metadata: { toLocation, reason },
        ...meta,
      });

      return NextResponse.json({ patient: serializePatient(updatedPatient) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/:id/movements] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
