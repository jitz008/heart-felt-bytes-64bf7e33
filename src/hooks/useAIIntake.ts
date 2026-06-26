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

export function useAIIntake() {
  const [session, setSession] = useState<IntakeSession>(initial);

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
      return intake;
    } catch {
      setSession(initial);
      return null;
    }
  }, []);

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
