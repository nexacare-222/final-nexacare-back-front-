import { GoogleGenAI } from '@google/genai';

/**
 * Server-only. GEMINI_API_KEY must NOT appear in next.config.js env/
 * publicRuntimeConfig, and must never be prefixed NEXT_PUBLIC_ - either
 * of those would inline it into the client bundle exactly like the old
 * vite.config.ts define block did. Reading it here, inside a file that's
 * only ever imported from API routes, keeps it server-side.
 */
const apiKey = process.env.GEMINI_API_KEY;

export const geminiClient = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'nexacare-backend' } },
    })
  : null;

export const GEMINI_MODEL = 'gemini-2.5-flash';
