// Client-side Gemini caller used when the Express server isn't available
// (e.g. Lovable preview). Reads the key from localStorage so it stays
// out of the bundled source.

const LS_KEY = 'pulse_gemini_api_key';

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem(LS_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    ''
  );
}

export function setGeminiApiKey(key: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, key);
}

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const hasClientGeminiKey = () => Boolean(getApiKey());

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
