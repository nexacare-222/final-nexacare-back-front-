import { Patient, CareEvent, LabReport } from "../types";
import { apiPost, ApiError } from "./apiClient";

export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  try {
    const data = await apiPost<{ text: string }>("/api/gemini/summary", { patient });
    return data.text || "No summary available.";
  } catch (error) {
    console.error("Patient summary fetching error:", error instanceof ApiError ? error.message : error);
    return "Unable to generate AI summary.";
  }
};

export const generateClinicalAnalysis = async (patient: Patient, recentEvents: CareEvent[], reports: LabReport[]): Promise<string> => {
  try {
    const data = await apiPost<{ text: string }>("/api/gemini/analysis", { patient, recentEvents, reports });
    return data.text || "Analysis generation failed.";
  } catch (error) {
    console.error("Clinical analysis fetching error:", error instanceof ApiError ? error.message : error);
    return "Unable to generate clinical analysis.";
  }
};

export const askAiConsultant = async (patient: Patient, question: string, history: {role: 'user' | 'model', text: string}[]): Promise<string> => {
  try {
    const data = await apiPost<{ text: string }>("/api/gemini/consult", { patient, question, history });
    return data.text || "I couldn't process that clinical query.";
  } catch (error) {
    console.error("AI Consultant fetching error:", error instanceof ApiError ? error.message : error);
    return "Consultation system error.";
  }
};
