import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntakeSession } from '../hooks/useAIIntake';

interface Props {
  session: IntakeSession;
  onAnswer: (value: string) => void;
  onConfirm: () => void;
  onAddDetails: () => void;
  onCancel: () => void;
}

export default function ChipClarifier({
  session,
  onAnswer,
  onConfirm,
  onAddDetails,
  onCancel,
}: Props) {
  if (session.phase === 'idle' || session.phase === 'done') return null;

  if (session.phase === 'thinking') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass px-4 py-3 text-[12px] text-white/55"
      >
        Pulse AI is reading your task…
      </motion.div>
    );
  }

  const { intake } = session;
  if (!intake) return null;

  if (session.phase === 'questioning') {
    const q = intake.clarifyingQuestions[session.questionIndex];
    if (!q) return null;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${session.questionIndex}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="glass px-4 py-3 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/70">{q.question}</span>
            <button
              onClick={onCancel}
              className="text-[11px] text-white/30 hover:text-white/60"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {q.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onAnswer(chip)}
                className="glass-input px-2.5 py-1 text-[11px] text-white/80 hover:text-white hover:border-[rgba(79,142,247,0.4)] rounded-lg transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // confirming
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass px-4 py-3 flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/70">Want to add more?</span>
        <button
          onClick={onCancel}
          className="text-[11px] text-white/30 hover:text-white/60"
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)',
            color: 'white',
          }}
        >
          No, create task
        </button>
        <button
          type="button"
          onClick={onAddDetails}
          className="glass-input px-3 py-1.5 text-[11px] text-white/75 rounded-lg"
        >
          Yes, add details
        </button>
      </div>
    </motion.div>
  );
}
