import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { registerPatientSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializePatient } from '@/lib/serializers';

const patientInclude = {
  assignedNurses: true,
  movements: true,
  vitals: true,
  dischargeDetails: true,
} as const;

/**
 * Any authenticated staff role sees the full roster; a PATIENT_PARTY
 * account only ever sees the single patient it's linked to (enforced here,
 * not left to the client).
 */
export const GET = withAuth(async (_request, _ctx, session) => {
  if (session.role === 'PATIENT_PARTY') {
    if (!session.linkedPatientId) {
      return NextResponse.json({ patients: [] });
    }
    const patient = await prisma.patient.findUnique({
      where: { id: session.linkedPatientId },
      include: patientInclude,
    });
    return NextResponse.json({ patients: patient ? [serializePatient(patient)] : [] });
  }

  const patients = await prisma.patient.findMany({
    include: patientInclude,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ patients: patients.map(serializePatient) });
});

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(registerPatientSchema, body);

      const doctor = await prisma.user.findUnique({ where: { id: data.assignedDoctorId } });
      if (!doctor || doctor.role !== 'DOCTOR') {
        return NextResponse.json({ error: 'assignedDoctorId must reference an existing doctor' }, { status: 400 });
      }

      const patient = await prisma.patient.create({
        data: {
          id: data.id,
          name: data.name,
          age: data.age,
          gender: data.gender,
          admissionTimestamp: new Date(),
          currentLocation: data.currentLocation,
          condition: data.condition,
          assignedDoctorId: data.assignedDoctorId,
          qrToken: data.qrToken,
          diagnosis: data.diagnosis,
          severity: data.severity,
          bloodGroup: data.bloodGroup as any,
          allergies: data.allergies ?? [],
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          address: data.address,
          insuranceProvider: data.insuranceProvider,
          insurancePolicyNumber: data.insurancePolicyNumber,
          aadharNumber: data.aadharNumber,
          dob: data.dob,
          state: data.state,
          familyMemberName: data.familyMemberName,
          familyMemberRelationship: data.familyMemberRelationship,
          familyMemberPhone: data.familyMemberPhone,
        },
        include: patientInclude,
      });

      await recordAudit({
        userId: session.userId,
        action: 'PATIENT_REGISTER',
        resourceType: 'Patient',
        resourceId: patient.id,
        ...meta,
      });

      return NextResponse.json({ patient: serializePatient(patient) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[patients] create error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'] },
);
