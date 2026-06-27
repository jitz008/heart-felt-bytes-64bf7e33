// src/components/AIConversationPanel.tsx
// Renders the live conversation surface beneath the AI input:
//   - Clarifying / enriching question with chips + free-text answer
//   - Confirmation summary with chips + Create / Add more / Cancel
//   - Slash command result panel (BREAKDOWN / RESCUE / PLAN / HABIT_CHECK)

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, X, Sparkles, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import { AIConversationState } from '../hooks/useAIConversation';

interface Props {
  state: AIConversationState;
  onAnswer: (text: string) => void;
  onConfirm: () => void;
  onAddMore: () => void;
  onCancel: () => void;
}

export default function AIConversationPanel({
  state,
  onAnswer,
  onConfirm,
  onAddMore,
  onCancel,
}: Props) {
  const { phase, response, error } = state;
  if (phase === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass p-4 flex flex-col gap-3"
      >
        {phase === 'thinking' && <Thinking />}
        {phase === 'error' && <ErrorBox error={error} onCancel={onCancel} />}
        {(phase === 'clarifying' || phase === 'enriching') && response && (
          <ClarifyingBlock response={response} onAnswer={onAnswer} onCancel={onCancel} />
        )}
        {phase === 'confirming' && response && (
          <ConfirmBlock
            response={response}
            onConfirm={onConfirm}
            onAddMore={onAddMore}
            onCancel={onCancel}
          />
        )}
        {phase === 'slash_result' && response?.slashCommandResponse && (
          <SlashBlock response={response} onCancel={onCancel} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-white/55">
      <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] gemini-dot" />
      <span>Pulse AI is thinking…</span>
    </div>
  );
}

function ErrorBox({ error, onCancel }: { error: string | null; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[12px] text-red-300">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{error || 'Something went wrong.'}</span>
      </div>
      <button
        onClick={onCancel}
        className="glass-input px-2.5 py-1 text-[11px] text-white/70 rounded-lg"
      >
        Dismiss
      </button>
    </div>
  );
}

function ClarifyingBlock({
  response,
  onAnswer,
  onCancel,
}: {
  response: NonNullable<AIConversationState['response']>;
  onAnswer: (t: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState('');
  const q = response.clarifyingQuestion;
  if (!q) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4f8ef7] mt-0.5 shrink-0" />
          <p className="text-[13px] text-white/85 leading-snug">{q.question}</p>
        </div>
        <button onClick={onCancel} className="text-white/35 hover:text-white/75 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {q.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {q.chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onAnswer(chip)}
              className="glass-input px-2.5 py-1 text-[11px] text-white/75 hover:text-white hover:border-[rgba(79,142,247,0.4)] rounded-lg transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) {
            onAnswer(val);
            setVal('');
          }
        }}
        className="flex items-center gap-2"
      >
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Or type your own…"
          className="flex-1 glass-input px-3 py-1.5 text-[12px] text-white/85 placeholder:text-white/30 rounded-lg outline-none"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-[11px] rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ConfirmBlock({
  response,
  onConfirm,
  onAddMore,
  onCancel,
}: {
  response: NonNullable<AIConversationState['response']>;
  onConfirm: () => void;
  onAddMore: () => void;
  onCancel: () => void;
}) {
  const priorityDot =
    response.priority === 'high'
      ? 'bg-red-400'
      : response.priority === 'medium'
        ? 'bg-amber-400'
        : 'bg-emerald-400';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
          <p className="text-[14px] font-medium text-white/95">{response.title}</p>
        </div>
        <button onClick={onCancel} className="text-white/35 hover:text-white/75 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {response.confirmationChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {response.confirmationChips.map((chip) => (
            <span
              key={chip}
              className="glass-input px-2.5 py-1 text-[11px] text-white/70 rounded-lg"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {response.priorityReason && (
        <p className="text-[11px] text-white/40 leading-snug">{response.priorityReason}</p>
      )}

      {response.roadmapSteps && response.roadmapSteps.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <p className="text-[11px] text-white/50 uppercase tracking-wide">Roadmap</p>
          {response.roadmapSteps.slice(0, 5).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] text-white/75">
              <span className="text-white/40">{s.icon || '•'}</span>
              <span className="flex-1">{s.step}</span>
              {s.timing && (
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {s.timing}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
        >
          <Check className="w-3.5 h-3.5" />
          Create task
        </button>
        <button
          onClick={onAddMore}
          className="flex items-center gap-1.5 glass-input px-3 py-1.5 text-[12px] text-white/80 hover:text-white rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          Add more context
        </button>
      </div>
    </div>
  );
}

function SlashBlock({
  response,
  onCancel,
}: {
  response: NonNullable<AIConversationState['response']>;
  onCancel: () => void;
}) {
  const slash = response.slashCommandResponse!;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4f8ef7]" />
          <p className="text-[14px] font-medium text-white/95">{slash.title}</p>
        </div>
        <button onClick={onCancel} className="text-white/35 hover:text-white/75 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {slash.content.map((item, i) => {
          if (item.type === 'overview') {
            return (
              <p key={i} className="text-[12px] text-white/70 leading-relaxed">
                {item.text}
              </p>
            );
          }
          if (item.type === 'step') {
            return (
              <div key={i} className="flex items-start gap-2 text-[12px] text-white/80">
                <span
                  className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-medium"
                  style={{ background: 'rgba(79,142,247,0.18)', color: '#9bbcf7' }}
                >
                  {item.number ?? i + 1}
                </span>
                <span className="flex-1">{item.text}</span>
                {item.timeEstimate && (
                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timeEstimate}
                  </span>
                )}
              </div>
            );
          }
          if (item.type === 'warning') {
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] text-amber-200/85 rounded-lg p-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          }
          if (item.type === 'tip') {
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] text-emerald-200/85 rounded-lg p-2"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}
              >
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          }
          return (
            <p key={i} className="text-[12px] text-white/70">
              {item.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
