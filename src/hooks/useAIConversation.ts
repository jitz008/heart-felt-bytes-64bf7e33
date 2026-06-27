// src/hooks/useAIConversation.ts
// State machine that drives the multi-turn Gemini conversation defined in
// src/lib/gemini.ts. Wraps processWithGemini + processSlashCommand and exposes
// a clean API for HomeView: submit, answerChip, confirm, addMore, reset.

import { useCallback, useRef, useState } from 'react';
import {
  ConversationMessage,
  TaskAIResponse,
  TaskBriefForAI,
  processSlashCommand,
  processWithGemini,
} from '../lib/gemini';
import { Task } from '../types';

export type ConversationPhase =
  | 'idle'
  | 'thinking'
  | 'clarifying'
  | 'confirming'
  | 'enriching'
  | 'slash_result'
  | 'error';

export interface AIConversationState {
  phase: ConversationPhase;
  history: ConversationMessage[];
  response: TaskAIResponse | null;
  rawInput: string;
  error: string | null;
}

const SLASH_MAP: Record<string, 'break_it_down' | 'rescue_me' | 'plan_my_day' | 'habit_check'> = {
  '/break': 'break_it_down',
  '/breakitdown': 'break_it_down',
  '/break it down': 'break_it_down',
  '/rescue': 'rescue_me',
  '/rescueme': 'rescue_me',
  '/rescue me': 'rescue_me',
  '/plan': 'plan_my_day',
  '/planmyday': 'plan_my_day',
  '/plan my day': 'plan_my_day',
  '/habit': 'habit_check',
  '/habitcheck': 'habit_check',
  '/habit check': 'habit_check',
};

function detectSlash(input: string): {
  cmd: 'break_it_down' | 'rescue_me' | 'plan_my_day' | 'habit_check' | null;
  rest: string;
} {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { cmd: null, rest: trimmed };
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(SLASH_MAP)) {
    if (lower === key || lower.startsWith(key + ' ')) {
      return { cmd: SLASH_MAP[key], rest: trimmed.slice(key.length).trim() };
    }
  }
  return { cmd: null, rest: trimmed };
}

function tasksToBriefs(tasks: Task[]): TaskBriefForAI[] {
  const today = new Date();
  return tasks
    .filter((t) => t.status === 'active')
    .map((t) => {
      const time = t.deadline_iso ? new Date(t.deadline_iso) : null;
      const sameDay =
        time &&
        time.getFullYear() === today.getFullYear() &&
        time.getMonth() === today.getMonth() &&
        time.getDate() === today.getDate();
      return {
        title: t.title,
        priority:
          t.priority ||
          (t.urgency === 'critical' ? 'high' : t.urgency === 'high' ? 'medium' : 'low'),
        time: sameDay ? t.deadline_human || t.deadline_iso : t.deadline_human || null,
        status: t.status,
      };
    });
}

export function useAIConversation(opts: {
  tasks: Task[];
  addTaskFromAI: (res: TaskAIResponse) => Promise<Task>;
}) {
  const { tasks, addTaskFromAI } = opts;

  const [state, setState] = useState<AIConversationState>({
    phase: 'idle',
    history: [],
    response: null,
    rawInput: '',
    error: null,
  });

  // Always read the latest tasks list when we serialize context for Gemini.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      history: [],
      response: null,
      rawInput: '',
      error: null,
    });
  }, []);

  const runConversation = useCallback(
    async (history: ConversationMessage[], rawInput: string) => {
      setState((s) => ({ ...s, phase: 'thinking', history, rawInput, error: null }));
      try {
        const res = await processWithGemini(
          history,
          new Date().toISOString(),
          tasksToBriefs(tasksRef.current),
        );

        // Auto-create when Gemini says we have enough.
        if (res.state === 'CREATING') {
          if (res.multipleTasks && res.multipleTasks.length > 0) {
            for (const t of res.multipleTasks) await addTaskFromAI(t);
          } else {
            await addTaskFromAI(res);
          }
          setState({
            phase: 'idle',
            history: [],
            response: null,
            rawInput: '',
            error: null,
          });
          return;
        }

        const phase: ConversationPhase =
          res.state === 'CLARIFYING'
            ? 'clarifying'
            : res.state === 'ENRICHING'
              ? 'enriching'
              : 'confirming';

        setState({
          phase,
          history,
          response: res,
          rawInput,
          error: null,
        });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          phase: 'error',
          error: err?.message === 'TIMEOUT' ? 'Pulse AI timed out. Try again.' : 'AI error.',
        }));
      }
    },
    [addTaskFromAI],
  );

  /** Start a brand-new conversation from raw user input. */
  const submit = useCallback(
    async (rawInput: string) => {
      const text = rawInput.trim();
      if (!text) return;

      // Slash commands take a separate path.
      const { cmd, rest } = detectSlash(text);
      if (cmd) {
        setState((s) => ({ ...s, phase: 'thinking', rawInput: text, error: null }));
        try {
          const res = await processSlashCommand(
            cmd,
            rest,
            tasksToBriefs(tasksRef.current),
            new Date().toISOString(),
          );
          setState({
            phase: 'slash_result',
            history: [{ role: 'user', content: text }],
            response: res,
            rawInput: text,
            error: null,
          });
        } catch (err: any) {
          setState((s) => ({
            ...s,
            phase: 'error',
            error: err?.message === 'TIMEOUT' ? 'Pulse AI timed out. Try again.' : 'AI error.',
          }));
        }
        return;
      }

      const history: ConversationMessage[] = [{ role: 'user', content: text }];
      await runConversation(history, text);
    },
    [runConversation],
  );

  /** Answer a clarifying chip or free-text in the current question. */
  const answer = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const history: ConversationMessage[] = [
        ...state.history,
        {
          role: 'assistant',
          content: JSON.stringify({
            clarifyingQuestion: state.response?.clarifyingQuestion,
            state: state.response?.state,
          }),
        },
        { role: 'user', content: t },
      ];
      await runConversation(history, state.rawInput);
    },
    [runConversation, state.history, state.response, state.rawInput],
  );

  /** Confirm the current task summary and persist. */
  const confirm = useCallback(async () => {
    if (!state.response) return;
    try {
      await addTaskFromAI(state.response);
    } finally {
      reset();
    }
  }, [addTaskFromAI, reset, state.response]);

  /** Ask Gemini for the deeper enriching questions. */
  const addMore = useCallback(async () => {
    if (!state.response) return;
    const history: ConversationMessage[] = [
      ...state.history,
      {
        role: 'assistant',
        content: JSON.stringify({ confirmationChips: state.response.confirmationChips }),
      },
      { role: 'user', content: 'Yes, ask me for more context to enrich this task.' },
    ];
    await runConversation(history, state.rawInput);
  }, [runConversation, state.history, state.response, state.rawInput]);

  return { state, submit, answer, confirm, addMore, reset };
}
