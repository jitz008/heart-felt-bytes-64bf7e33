// Intercepts /api/gemini/* and /api/ai-status calls and serves them
// client-side when the Express server isn't running (Lovable preview).
// On AI Studio / local dev with `npm run dev`, the real server responds
// first and we never hit the fallback.

import { callGeminiJSON, hasClientGeminiKey } from './geminiClient';

type Handler = (body: any) => Promise<any>;

const handlers: Record<string, Handler> = {
  '/api/ai-status': async () => ({
    live: hasClientGeminiKey(),
    message: hasClientGeminiKey()
      ? 'Pulse AI is connected (client-side Gemini).'
      : 'Add VITE_GEMINI_API_KEY to enable live AI in the preview.',
  }),

  '/api/gemini/parse': async (body) => {
    const sys = `You parse a user's natural-language task into JSON.
Return ONLY this schema:
{"title":string,"deadline_human":string,"estimated_minutes":number,"difficulty":"easy"|"medium"|"hard","urgency":"critical"|"high"|"later"}
Current datetime: ${body.datetime}`;
    return callGeminiJSON(`Task: ${body.input}`, sys);
  },

  '/api/gemini/checklist': async (body) => {
    const sys = `You break a task into 3-6 incremental sub-steps of about 5 minutes each.
Return ONLY a JSON array: [{"step":string,"minutes":number}, ...]`;
    const out = await callGeminiJSON(
      `Task: ${body.title}\nDeadline: ${body.deadline_human}\nEstimated minutes: ${body.estimated_minutes}\nDifficulty: ${body.difficulty}`,
      sys,
    );
    return Array.isArray(out) ? out : out?.steps || [];
  },

  '/api/gemini/intake': async (body) => {
    const sys = `You are Pulse, a task-intake assistant.
Return ONLY this JSON schema:
{
 "taskType":"meeting|event|payment|errand|social|other",
 "complexity":"simple|medium|complex",
 "extractedEntities":{"time":"","person":"","location":""},
 "missingCritical":["when","who"],
 "clarifyingQuestions":[{"key":"when","question":"When is this?","chips":["Today","Tomorrow","This week","Pick a date"]}],
 "priority":"high|medium|low",
 "priorityReason":"",
 "roadmapSteps":[{"step":"","timing":""}],
 "userPace":"hurried|casual"
}
Rules: simple=single action no person; medium=involves another person; complex=professional event needing prep.
Professional/payment/deadline -> high. Casual social -> low unless urgent. Within 2h -> high.
Current datetime: ${body.datetime}`;
    return callGeminiJSON(`User input: ${body.input}`, sys);
  },
};

export function installApiInterceptor() {
  if (typeof window === 'undefined') return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as any).url || String(input);
    const matched = Object.keys(handlers).find((p) => url.endsWith(p) || url.includes(p + '?'));

    if (!matched) return originalFetch(input as any, init);

    // Try the real server first; if it returns HTML (SPA fallback) or 404, use client handler.
    try {
      const res = await originalFetch(input as any, init);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) return res;
    } catch {
      // network error -> fall through to client handler
    }

    try {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const data = await handlers[matched](body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err?.message || 'client-side handler failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  };
}
