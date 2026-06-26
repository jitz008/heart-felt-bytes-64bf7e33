import { useCallback, useState } from 'react';
import { IntakeResult } from '../types';

type Phase = 'idle' | 'thinking' | 'questioning' | 'confirming' | 'done';

export interface IntakeSession {
  phase: Phase;
  intake: IntakeResult | null;
  questionIndex: number;
  answers: Record<string, string>;
  rawInput: string;
}

const initial: IntakeSession = {
  phase: 'idle',
  intake: null,
  questionIndex: 0,
  answers: {},
  rawInput: '',
};

const titleCase = (value = '') => {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : 'New task';
};

const fallbackIntake = (input: string): IntakeResult => {
  const lower = input.toLowerCase();
  const isComplex = /break down|project|presentation|report|deck|proposal|strategy|plan/.test(lower);
  const isMedium = /meeting|call|with|client|team|friend|boss/.test(lower);
  const complexity: IntakeResult['complexity'] = isComplex ? 'complex' : isMedium ? 'medium' : 'simple';
  const hasWhen = /today|tomorrow|week|morning|evening|tonight|asap|urgent|\d/.test(lower);
  const hasWho = /with\s+([a-z]+)/i.test(input) || /client|team|friend|boss|teacher/.test(lower);
  const highIntent = /urgent|asap|today|deadline|client|meeting|presentation|interview|pay|bill|due/.test(lower);
  const mediumIntent = /tomorrow|soon|this week|call|project|report|prepare|finish/.test(lower);
  const cleanedTitle = input.replace(/^\/?\s*(break it down|rescue me|plan my day|habit check)\s*/i, '').trim() || input;

  return {
    title: titleCase(cleanedTitle),
    taskType: /pay|bill|invoice|rent/.test(lower)
      ? 'payment'
      : /meeting|call|client/.test(lower)
        ? 'meeting'
        : /lunch|dinner|party|friend/.test(lower)
          ? 'social'
          : /pickup|buy|go to|errand/.test(lower)
            ? 'errand'
            : 'other',
    complexity,
    extractedEntities: {
      time: hasWhen ? (/tomorrow/.test(lower) ? 'Tomorrow' : /week/.test(lower) ? 'This week' : 'Today') : '',
      person: hasWho ? (input.match(/with\s+([A-Za-z]+)/)?.[1] || (/client/.test(lower) ? 'Client' : 'Team')) : '',
      location: '',
    },
    missingCritical: [!hasWhen ? 'when' : '', complexity !== 'simple' && !hasWho ? 'who' : ''].filter(Boolean),
    clarifyingQuestions: [
      ...(!hasWhen ? [{ key: 'when', question: 'When is this?', chips: ['Today', 'Tomorrow', 'This week', 'Pick a date'] }] : []),
      ...(complexity !== 'simple' && !hasWho ? [{ key: 'who', question: 'Who is involved?', chips: ['Client', 'Team', 'Friend', 'Just me'] }] : []),
    ],
    priority: highIntent ? 'high' : mediumIntent ? 'medium' : 'low',
    priorityReason: highIntent ? 'Time-sensitive or professional task.' : mediumIntent ? 'Important but not immediate.' : 'Low-pressure task.',
    roadmapSteps: complexity === 'complex'
      ? [
          { step: `Define the outcome for ${cleanedTitle}`, timing: '5 min' },
          { step: 'Collect the key notes, files, and constraints', timing: '12 min' },
          { step: 'Draft the first usable version', timing: '24 min' },
          { step: 'Review, tighten, and prepare final delivery', timing: '15 min' },
        ]
      : [],
    userPace: /asap|now|quick|urgent/.test(lower) ? 'hurried' : 'casual',
  };
};

export function useAIIntake() {
  const [session, setSession] = useState<IntakeSession>(initial);

  const applyIntake = useCallback((intake: IntakeResult) => {
    const needsAsk =
      intake.userPace !== 'hurried' &&
      intake.clarifyingQuestions &&
      intake.clarifyingQuestions.length > 0;
    setSession((s) => ({
      ...s,
      intake,
      phase: needsAsk ? 'questioning' : 'confirming',
      questionIndex: 0,
    }));
  }, []);

  const start = useCallback(async (input: string): Promise<IntakeResult | null> => {
    setSession({ ...initial, phase: 'thinking', rawInput: input });
    try {
      const res = await fetch('/api/gemini/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, datetime: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('intake unavailable');
      const intake = (await res.json()) as IntakeResult;
      applyIntake(intake);
      return intake;
    } catch {
      // If the preview/API route/Gemini quota fails, keep the UX alive with
      // deterministic local intake instead of clearing the input silently.
      const intake = fallbackIntake(input);
      applyIntake(intake);
      return intake;
    }
  }, [applyIntake]);

  const answer = useCallback((value: string) => {
    setSession((s) => {
      if (!s.intake) return s;
      const q = s.intake.clarifyingQuestions[s.questionIndex];
      const key = q?.key || q?.question || `q${s.questionIndex}`;
      const nextAnswers = { ...s.answers, [key]: value };
      const nextIndex = s.questionIndex + 1;
      const hasMore = nextIndex < s.intake.clarifyingQuestions.length;
      return {
        ...s,
        answers: nextAnswers,
        questionIndex: nextIndex,
        phase: hasMore ? 'questioning' : 'confirming',
      };
    });
  }, []);

  const reset = useCallback(() => setSession(initial), []);
  const finish = useCallback(() => setSession((s) => ({ ...s, phase: 'done' })), []);

  return { session, start, answer, finish, reset };
}
