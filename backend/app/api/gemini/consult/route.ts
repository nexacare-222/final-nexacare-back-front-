import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/rbac/withAuth';
import { geminiClient, GEMINI_MODEL } from '@/lib/gemini/client';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

interface ConsultPatientInput {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis?: string;
  condition: string;
  currentLocation: string;
}

interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export const POST = withAuth(
  async (request, _ctx, session) => {
    const meta = requestMeta(request);
    try {
      const body = await request.json().catch(() => null);
      const patient = body?.patient as ConsultPatientInput | undefined;
      const question = typeof body?.question === 'string' ? body.question : '';
      const history = (body?.history ?? []) as HistoryTurn[];

      if (!patient?.id || !question.trim()) {
        return NextResponse.json({ error: 'Missing patient or question' }, { status: 400 });
      }
      if (question.length > 2000) {
        return NextResponse.json({ error: 'Question too long' }, { status: 400 });
      }

      await recordAudit({
        userId: session.userId,
        action: 'GEMINI_CONSULT_REQUEST',
        resourceType: 'Patient',
        resourceId: patient.id,
        metadata: { questionLength: question.length },
        ...meta,
      });

      if (!geminiClient) {
        return NextResponse.json({ text: 'AI Consultant offline.' });
      }

      const systemContext = `
        You are a specialized Medical Consultant AI within the NexaCare system.
        You are assisting a healthcare professional.

        **Current Patient Data:**
        Name: ${patient.name} (${patient.age}y ${patient.gender})
        Diagnosis: ${patient.diagnosis}
        Condition: ${patient.condition}
        Current Location: ${patient.currentLocation}

        Answer clinical questions based on this patient. If you don't have enough data (e.g.
        specific past labs not listed), state that you are making suggestions based on current
        symptoms. Be precise, brief, and medical-grade in your terminology.
      `;

      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        ...history.slice(-20).map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: question }] },
      ];

      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents,
      });

      return NextResponse.json({ text: response.text || "I couldn't process that clinical query." });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('[gemini/consult] error', err);
      return NextResponse.json({ error: 'Consultation system error.' }, { status: 500 });
    }
  },
  { roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
);
