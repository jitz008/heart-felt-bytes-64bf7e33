// Intercepts /api/gemini/* and /api/ai-status calls and serves them
// client-side when the Express server isn't running (Lovable preview).
// On AI Studio / local dev with `npm run dev`, the real server responds
// first and we never hit the fallback.

import { callGeminiJSON, hasClientGeminiKey } from './geminiClient';

const titleCase = (value = '') => {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : 'New task';
};

const inferUrgency = (text = ''): 'critical' | 'high' | 'later' => {
  const lower = text.toLowerCase();
  if (/urgent|asap|now|today|deadline|client|meeting|presentation|interview|pay|bill|due/.test(lower)) return 'critical';
  if (/tomorrow|soon|this week|call|project|report|prepare|finish/.test(lower)) return 'high';
  return 'later';
};

const inferPriority = (text = ''): 'high' | 'medium' | 'low' => {
  const urgency = inferUrgency(text);
  return urgency === 'critical' ? 'high' : urgency === 'high' ? 'medium' : 'low';
};

const inferDifficulty = (text = ''): 'easy' | 'medium' | 'hard' => {
  const lower = text.toLowerCase();
  if (/presentation|project|interview|client|report|build|plan|strategy|proposal/.test(lower)) return 'hard';
  if (/call|meeting|prepare|write|review|schedule/.test(lower)) return 'medium';
  return 'easy';
};

const inferCategory = (text = ''): 'work' | 'study' | 'personal' | 'finance' | 'health' => {
  const lower = text.toLowerCase();
  if (/pay|bill|rent|invoice|bank/.test(lower)) return 'finance';
  if (/gym|doctor|health|run|medicine/.test(lower)) return 'health';
  if (/study|exam|homework|read|course/.test(lower)) return 'study';
  if (/meeting|client|project|report|presentation|work|deck|interview/.test(lower)) return 'work';
  return 'personal';
};

const deadlineFor = (text = '') => {
  const lower = text.toLowerCase();
  const date = new Date();
  if (/tomorrow/.test(lower)) date.setDate(date.getDate() + 1);
  else if (/this week|weekend/.test(lower)) date.setDate(date.getDate() + 3);
  date.setHours(/morning/.test(lower) ? 9 : /evening|tonight/.test(lower) ? 18 : 17, 0, 0, 0);
  if (!/today|tomorrow|this week|weekend|tonight|morning|evening|deadline|due/.test(lower)) {
    return { deadline_iso: null, deadline_human: null };
  }
  return {
    deadline_iso: date.toISOString(),
    deadline_human: /tomorrow/.test(lower)
      ? 'Tomorrow · 5 PM'
      : /this week|weekend/.test(lower)
        ? 'This week'
        : /morning/.test(lower)
          ? 'Today · 9 AM'
          : /evening|tonight/.test(lower)
            ? 'Today · 6 PM'
            : 'Today · 5 PM',
  };
};

const localParseTask = (input = '') => {
  const difficulty = inferDifficulty(input);
  const estimated = difficulty === 'hard' ? 90 : difficulty === 'medium' ? 35 : 15;
  return {
    title: titleCase(input).slice(0, 80),
    ...deadlineFor(input),
    estimated_minutes: estimated,
    difficulty,
    urgency: inferUrgency(input),
    category: inferCategory(input),
    priority_score: inferUrgency(input) === 'critical' ? 9 : inferUrgency(input) === 'high' ? 6 : 3,
    calendar_conflict: null,
    reasoning: 'Prioritized locally so task creation works even when live AI is unavailable.',
  };
};

const localChecklist = (title = 'this task', estimated = 30) => {
  const lower = title.toLowerCase();
  if (/break down|presentation|project|report|deck|plan/.test(lower)) {
    return [
      { step: `Define the outcome for ${title.replace(/^break down\s*/i, '')}`, minutes: 5 },
      { step: 'Collect the key notes, files, and constraints', minutes: Math.max(5, Math.round(estimated * 0.2)) },
      { step: 'Draft the first usable version', minutes: Math.max(10, Math.round(estimated * 0.4)) },
      { step: 'Review, tighten, and prepare final delivery', minutes: Math.max(10, Math.round(estimated * 0.25)) },
    ];
  }
  return [
    { step: `Open everything needed for ${title}`, minutes: 5 },
    { step: 'Complete the smallest useful next action', minutes: Math.max(10, Math.round(estimated * 0.5)) },
    { step: 'Check the result and mark it done', minutes: 5 },
  ];
};

const localIntake = (input = '') => {
  const lower = input.toLowerCase();
  const complexity = inferDifficulty(input) === 'hard' ? 'complex' : /with|call|meet|lunch|person|client/.test(lower) ? 'medium' : 'simple';
  const priority = inferPriority(input);
  const hasWhen = /today|tomorrow|week|morning|evening|tonight|\d/.test(lower);
  const hasWho = /with\s+([a-z]+)/i.test(input) || /client|team|friend|boss|teacher/.test(lower);
  return {
    title: titleCase(input.replace(/^\/?\s*(break it down|rescue me|plan my day|habit check)\s*/i, '').trim() || input),
    taskType: /pay|bill/.test(lower) ? 'payment' : /meeting|call|client/.test(lower) ? 'meeting' : /lunch|party|friend/.test(lower) ? 'social' : /pickup|buy|go to/.test(lower) ? 'errand' : 'other',
    complexity,
    extractedEntities: {
      time: hasWhen ? (deadlineFor(input).deadline_human || '') : '',
      person: hasWho ? (input.match(/with\s+([A-Za-z]+)/)?.[1] || (/client/.test(lower) ? 'client' : 'team')) : '',
      location: '',
    },
    missingCritical: [complexity !== 'simple' && !hasWho ? 'who' : ''].filter(Boolean),
    clarifyingQuestions: [
      ...(complexity !== 'simple' && !hasWho ? [{ key: 'who', question: 'Who is involved?', chips: ['Client', 'Team', 'Friend', 'Just me'] }] : []),
    ],
    priority,
    priorityReason: priority === 'high' ? 'Time-sensitive or professional task.' : priority === 'medium' ? 'Important but not immediate.' : 'Low-pressure task.',
    roadmapSteps: complexity === 'complex'
      ? localChecklist(input, 60).map((item) => ({ step: item.step, timing: `${item.minutes} min` }))
      : [],
    userPace: /asap|now|quick|urgent/.test(lower) ? 'hurried' : 'casual',
  };
};

type Handler = (body: any) => Promise<any>;

const handlers: Record<string, Handler> = {
  '/api/ai-status': async () => ({
    live: hasClientGeminiKey(),
    message: hasClientGeminiKey()
      ? 'Pulse AI is connected (client-side Gemini).'
      : 'Pulse AI is running with local fallback intelligence.',
  }),

  '/api/calendar': async () => [],

  '/api/gemini/parse': async (body) => {
    const sys = `You parse a user's natural-language task into JSON.
Return ONLY this schema:
{"title":string,"deadline_human":string,"estimated_minutes":number,"difficulty":"easy"|"medium"|"hard","urgency":"critical"|"high"|"later"}
Current datetime: ${body.datetime}`;
    try {
      return await callGeminiJSON(`Task: ${body.input}`, sys);
    } catch {
      return localParseTask(body.input);
    }
  },

  '/api/gemini/checklist': async (body) => {
    const sys = `You break a task into 3-6 incremental sub-steps of about 5 minutes each.
Return ONLY a JSON array: [{"step":string,"minutes":number}, ...]`;
    try {
      const out = await callGeminiJSON(
        `Task: ${body.title}\nDeadline: ${body.deadline_human}\nEstimated minutes: ${body.estimated_minutes}\nDifficulty: ${body.difficulty}`,
        sys,
      );
      return Array.isArray(out) ? out : out?.steps || localChecklist(body.title, body.estimated_minutes);
    } catch {
      return localChecklist(body.title, body.estimated_minutes);
    }
  },

  '/api/gemini/intake': async (body) => {
    const sys = `You are Pulse, a task-intake assistant.
Return ONLY this JSON schema:
{
 "taskType":"meeting|event|payment|errand|social|other",
 "complexity":"simple|medium|complex",
 "extractedEntities":{"time":"","person":"","location":""},
 "missingCritical":["who"],
 "clarifyingQuestions":[{"key":"who","question":"Who is involved?","chips":["Client","Team","Friend","Just me"]}],
 "priority":"high|medium|low",
 "priorityReason":"",
 "roadmapSteps":[{"step":"","timing":""}],
 "userPace":"hurried|casual"
}
Rules: simple=single action no person; medium=involves another person; complex=professional event needing prep.
Professional/payment/deadline -> high. Casual social -> low unless urgent. Within 2h -> high. Date/time is optional; do not ask for it if the user did not mention it.
Current datetime: ${body.datetime}`;
    try {
      const out = await callGeminiJSON(`User input: ${body.input}`, sys);
      return { ...localIntake(body.input), ...out };
    } catch {
      return localIntake(body.input);
    }
  },

  '/api/gemini/nudge': async (body) => {
    const active = Array.isArray(body.tasks) ? body.tasks : [];
    const top = active.find((t: any) => t.urgency === 'critical') || active[0];
    return top
      ? [{ severity: top.urgency === 'critical' ? 'critical' : 'high', message: `${top.title} is the highest-pressure item. Start with one concrete 10-minute step.` }]
      : [];
  },

  '/api/gemini/recommend': async (body) => {
    const pending = Array.isArray(body.pending) ? body.pending.length : 0;
    return {
      recommendation: pending ? `You have ${pending} active task${pending === 1 ? '' : 's'}. Clear the highest-priority one before adding more.` : 'Your task list is clear. Add one meaningful next action when ready.',
      insight_type: pending ? 'risk' : 'timing',
    };
  },

  '/api/gemini/dayplan': async (body) => {
    const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 4) : [];
    return tasks.map((task: any, index: number) => ({
      time: `${9 + index}:00 AM`,
      end_time: `${9 + index}:30 AM`,
      title: task.title,
      type: 'task',
      priority: task.urgency || null,
      task_id: task.id || null,
      note: 'Local plan generated while live AI is unavailable.',
    }));
  },

  '/api/gemini/voice': async (body) => ({
    intent: body.transcript ? 'add_task' : 'ask_question',
    response_text: body.transcript ? `I heard: ${body.transcript}` : 'I did not catch that.',
    action: { task_title: body.transcript ? titleCase(body.transcript) : null, task_keyword: null, new_time: null },
  }),

  '/api/gemini/score': async (body) => {
    const pending = Array.isArray(body.pending) ? body.pending.length : 0;
    const done = Array.isArray(body.history) ? body.history.length : 0;
    return {
      score: Math.max(35, Math.min(95, 70 + done * 2 - pending * 3)),
      verdict: pending ? `${pending} active item${pending === 1 ? '' : 's'} waiting. Finish one priority task to raise momentum.` : 'Clean slate. Momentum is ready for the next task.',
      trend: done > pending ? 'improving' : 'stable',
      streak: Math.max(0, Math.min(9, done)),
    };
  },

  '/api/gemini/suggest-habits': async (body) => {
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const existing: string[] = Array.isArray(body.existing) ? body.existing : [];
    const sys = `You analyze a user's recent tasks and propose 3-5 daily/weekly HABITS that would
strengthen the recurring patterns you observe. Return ONLY a JSON array of:
{"name":string,"emoji":string,"category":"work|study|personal|finance|health",
 "cadence":"daily|weekly","target_per_week":1-7,
 "match_keywords":[lowercase keyword strings present in similar task titles],
 "reason":"one short sentence citing the observed pattern"}
Rules: do not repeat any habit already in the existing list. Keep names under 28 chars.
Prefer habits the user can realistically check off given their task themes.`;
    try {
      const out = await callGeminiJSON(
        `Existing habits: ${JSON.stringify(existing)}\nRecent tasks: ${JSON.stringify(tasks)}`,
        sys,
      );
      const list = Array.isArray(out) ? out : out?.habits || [];
      if (list.length) return list;
    } catch {
      /* fall through to local */
    }
    // Local fallback: derive habits from category frequencies
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.category] = (counts[t.category] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const presets: Record<string, any> = {
      work:     { name: 'Deep work block', emoji: '🧠', keywords: ['project', 'report', 'deck'] },
      study:    { name: 'Read 20 minutes', emoji: '📖', keywords: ['read', 'study', 'course'] },
      personal: { name: 'Daily reset',     emoji: '🌿', keywords: ['clean', 'tidy', 'plan'] },
      finance:  { name: 'Review finances', emoji: '💸', keywords: ['pay', 'bill', 'invoice'] },
      health:   { name: 'Move your body',  emoji: '🏃', keywords: ['gym', 'walk', 'run'] },
    };
    return top.map(([cat, n]) => ({
      name: presets[cat]?.name || `${cat} routine`,
      emoji: presets[cat]?.emoji || '✦',
      category: cat,
      cadence: 'daily',
      target_per_week: 5,
      match_keywords: presets[cat]?.keywords || [cat],
      reason: `You logged ${n} ${cat} task${n === 1 ? '' : 's'} recently — make it a habit.`,
    }));
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
      let data: any;
      try {
        data = await handlers[matched](body);
      } catch (handlerError) {
        // Gemini can be missing, rate-limited, or blocked in preview. The app
        // should still create useful tasks, so fall back per endpoint here.
        if (matched === '/api/gemini/intake') data = localIntake(body.input);
        else if (matched === '/api/gemini/parse') data = localParseTask(body.input);
        else if (matched === '/api/gemini/checklist') data = localChecklist(body.title, body.estimated_minutes);
        else throw handlerError;
      }
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
