// Client-side Gemini caller used when the Express server isn't available
// (e.g. Lovable preview). Reads VITE_GEMINI_API_KEY from build env.

const API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_GEMINI_API_KEY ||
  '';

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const hasClientGeminiKey = () => Boolean(API_KEY);

export async function callGeminiJSON(prompt: string, systemInstruction?: string): Promise<any> {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY not configured');

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try {
    return JSON.parse(text);
  } catch {
    // Strip code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  }
}
