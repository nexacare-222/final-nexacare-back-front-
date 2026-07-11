import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/rbac/withAuth';
import { geminiClient, GEMINI_MODEL } from '@/lib/gemini/client';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

interface AnalysisPatientInput {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  currentLocation: string;
  diagnosis?: string;
  vitals?: { hr?: number; bpSys?: number; bpDia?: number; spo2?: number; temp?: number };
}

interface CareEventLike {
  timestamp: number;
  priority: string;
  status: string;
  medications?: unknown[];
  nurseNotes?: string;
}

interface LabReportLike {
  date: string;
  testName: string;
  resultSummary: string;
}

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const patient = body?.patient as AnalysisPatientInput | undefined;
      const recentEvents = (body?.recentEvents ?? []) as CareEventLike[];
      const reports = (body?.reports ?? []) as LabReportLike[];

      if (!patient?.id || !patient?.name) {
        return NextResponse.json({ error: 'Missing required patient fields' }, { status: 400 });
      }

      await recordAudit({
        userId: session.userId,
        action: 'GEMINI_ANALYSIS_REQUEST',
        resourceType: 'Patient',
        resourceId: patient.id,
        ...meta,
      });

      if (!geminiClient) {
        return NextResponse.json({
          text: '## Clinical Analysis Unavailable\n\nSystem requires a valid API Key.',
        });
      }

      const recentActivity = recentEvents
        .slice(0, 15)
        .map(
          (e) =>
            `- ${new Date(e.timestamp).toLocaleString()}: ${e.priority} ${
              e.medications && e.medications.length > 0 ? 'Meds' : 'Checks'
            }. Status: ${e.status}. ${e.nurseNotes ? `Notes: ${e.nurseNotes}` : ''}`,
        )
        .join('\n');

      const labSummary = reports
        .slice(0, 5)
        .map((r) => `- ${r.date}: ${r.testName} (${r.resultSummary})`)
        .join('\n');

      const prompt = `
        You are an expert Clinical Intelligence System. Analyze this patient's comprehensive profile:

        **Patient:** ${patient.name} (${patient.age}y ${patient.gender}) | ID: ${patient.id}
        **Vitals:** HR ${patient.vitals?.hr}, BP ${patient.vitals?.bpSys}/${patient.vitals?.bpDia}, SpO2 ${patient.vitals?.spo2}%, Temp ${patient.vitals?.temp}
        **Clinical Context:** ${patient.condition} | Diagnosis: ${patient.diagnosis || 'Pending'}
        **Current Ward:** ${patient.currentLocation}

        **Recent Care Activity:**
        ${recentActivity}

        **Recent Lab Reports:**
        ${labSummary}

        **Requirements:**
        1. Provide a "Stability Score" (0-100%).
        2. Identify the top 3 critical risks.
        3. Suggest 3 immediate clinical interventions or investigations.
        4. Synthesize if current ward placement (${patient.currentLocation}) is optimal.

        Use professional Markdown. Be concise and authoritative.
      `;

      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return NextResponse.json({ text: response.text || 'Analysis generation failed.' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('[gemini/analysis] error', err);
      return NextResponse.json({ error: 'Unable to generate clinical analysis.' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'ADMIN'] },
);
