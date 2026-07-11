import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueSession } from '@/lib/auth/session';
import { qrLoginSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

/**
 * Family/visitor QR-badge login: the QR code encodes `Patient.qrToken`
 * (unique per admission). We resolve it to the PATIENT_PARTY account
 * linked to that patient and issue the same HttpOnly cookie pair the
 * password login flow uses — there is no separate "QR session" type.
 */
export async function POST(request: Request): Promise<Response> {
  const meta = requestMeta(request);
  try {
    const body = await request.json().catch(() => null);
    const { qrToken } = parseOrThrow(qrLoginSchema, body);

    const patient = await prisma.patient.findUnique({ where: { qrToken } });
    if (!patient) {
      await recordAudit({ action: 'QR_LOGIN_FAILED', metadata: { reason: 'unknown_token' }, ...meta });
      return NextResponse.json({ error: 'Invalid or expired QR code.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { linkedPatientId: patient.id, role: 'PATIENT_PARTY', status: 'ACTIVE' },
    });
    if (!user) {
      await recordAudit({ action: 'QR_LOGIN_FAILED', metadata: { reason: 'no_linked_account', patientId: patient.id }, ...meta });
      return NextResponse.json({ error: 'No family account is linked to this patient.' }, { status: 401 });
    }

    await issueSession(user, request, 'QR_LOGIN_SUCCESS');

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedPatientId: user.linkedPatientId,
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Invalid request', details: err.message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[auth/login-qr] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
