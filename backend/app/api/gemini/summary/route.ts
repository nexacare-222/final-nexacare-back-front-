import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/rbac/withAuth';
import { geminiClient, GEMINI_MODEL } from '@/lib/gemini/client';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

interface PatientSummaryInput {
  id: string;
  name: string;
  age: number;
  currentLocation: string;
  diagnosis?: string;
}

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const patient = body?.patient as PatientSummaryInput | undefined;

      if (!patient?.id || !patient?.name || !patient?.currentLocation) {
        return NextResponse.json({ error: 'Missing required patient fields' }, { status: 400 });
      }

      await recordAudit({
        userId: session.userId,
        action: 'GEMINI_SUMMARY_REQUEST',
        resourceType: 'Patient',
        resourceId: patient.id,
        ...meta,
      });

      if (!geminiClient) {
        return NextResponse.json({
          text: `AI Summary unavailable (API key missing). Patient in ${patient.currentLocation}.`,
        });
      }

      const prompt = `
        Summarize status for patient ${patient.name} (ID: ${patient.id}).
        Age: ${patient.age}, Diagnosis: ${patient.diagnosis || 'None'}, Location: ${patient.currentLocation}.
        Provide a 1-sentence quick pulse summary for a busy clinical dashboard.
      `;

      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return NextResponse.json({ text: response.text || 'No summary available.' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('[gemini/summary] error', err);
      return NextResponse.json({ error: 'Unable to generate AI summary.' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
);
