import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { shiftHandoverSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializePatient } from '@/lib/serializers';

const patientInclude = {
  assignedNurses: true,
  movements: true,
  vitals: true,
  dischargeDetails: true,
} as const;

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const { targetStaffId, patientIds, notes } = parseOrThrow(shiftHandoverSchema, body);

      const targetStaff = await prisma.user.findUnique({ where: { id: targetStaffId } });
      if (!targetStaff) {
        return NextResponse.json({ error: 'Target staff member not found' }, { status: 404 });
      }

      const updated = [];
      for (const patientId of patientIds) {
        if (targetStaff.role === 'DOCTOR') {
          updated.push(
            await prisma.patient.update({
              where: { id: patientId },
              data: { assignedDoctorId: targetStaffId },
              include: patientInclude,
            }),
          );
        } else {
          updated.push(
            await prisma.patient.update({
              where: { id: patientId },
              data: {
                assignedNurses: {
                  connectOrCreate: {
                    where: { patientId_nurseId: { patientId, nurseId: targetStaffId } },
                    create: { nurseId: targetStaffId },
                  },
                },
              },
              include: patientInclude,
            }),
          );
        }
      }

      const handoverFrom = await prisma.user.findUnique({ where: { id: session.userId } });
      await prisma.notification.create({
        data: {
          userId: targetStaffId,
          title: 'Shift Handover Received',
          message: `You have received a shift handover from ${handoverFrom?.name ?? 'Staff'}. ${patientIds.length} patients assigned. Notes: ${notes.substring(0, 50)}...`,
          type: 'ALERT',
        },
      });

      await recordAudit({
        userId: session.userId,
        action: 'SHIFT_HANDOVER',
        metadata: { targetStaffId, patientIds },
        ...meta,
      });

      return NextResponse.json({ patients: updated.map(serializePatient) });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients/shift-handover] error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'NURSE', 'STAFF', 'ADMIN'] },
);
