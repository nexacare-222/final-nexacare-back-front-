import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac/withAuth';
import { createLabReportSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';
import { serializeLabReport } from '@/lib/serializers';

export const GET = withAuth(async (_request, _ctx, session) => {
  const where = session.role === 'PATIENT_PARTY'
    ? { patientId: session.linkedPatientId ?? '__none__' }
    : {};
  const reports = await prisma.labReport.findMany({ where, orderBy: { timestamp: 'desc' } });
  return NextResponse.json({ reports: reports.map(serializeLabReport) });
});

/**
 * Reference example for the RBAC pattern described in the brief: a Nurse
 * hitting POST /api/lab-reports gets short-circuited with 403 by
 * `withAuth` before this handler body — and therefore before Prisma — ever
 * runs. Lab report creation/authorization is a Doctor/Admin action; nurses
 * can still read reports via a separate GET (not shown) with a broader
 * role list.
 */
export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const data = parseOrThrow(createLabReportSchema, body);

      const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      const report = await prisma.labReport.create({
        data: {
          patientId: data.patientId,
          testName: data.testName,
          category: data.category,
          date: data.date,
          doctorName: data.doctorName,
          resultSummary: data.resultSummary,
          data: data.data as never,
          fileUrl: data.fileUrl,
          status: 'COMPLETED',
        },
      });

      await recordAudit({
        userId: session.userId,
        action: 'LAB_REPORT_CREATE',
        resourceType: 'LabReport',
        resourceId: report.id,
        metadata: { patientId: data.patientId },
        ...meta,
      });

      return NextResponse.json({ report: serializeLabReport(report) }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: 'Invalid request', details: error.message }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      console.error('[lab-reports] create error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'ADMIN'] }, // NURSE is intentionally excluded
);
