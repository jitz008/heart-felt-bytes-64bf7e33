import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Plus, Check } from 'lucide-react';
import { Task } from '../types';

interface HomeViewProps {
  tasks: Task[];
  addTaskNatural: (input: string) => void;
  toggleComplete: (id: string) => void;
  aiLoading: boolean;
  aiStatusMessage?: string;
}

const QUICK_CMDS = [
  '/ Break it down',
  '/ Rescue me',
  '/ Plan my day',
  '/ Habit check',
];

export default function HomeView({
  tasks,
  addTaskNatural,
  toggleComplete,
  aiLoading,
  aiStatusMessage,
}: HomeViewProps) {
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<number | null>(null);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    addTaskNatural(t);
    setInput('');
    setInterim('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  // Voice recording (Web Speech API best-effort)
  const toggleRecording = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (ev: any) => {
      let txt = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        txt += ev.results[i][0].transcript;
      }
      setInterim(txt);
      if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
      silenceTimer.current = window.setTimeout(() => {
        rec.stop();
      }, 800);
    };
    rec.onend = () => {
      setRecording(false);
      if (interim.trim()) submit(interim);
    };
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    setRecording(true);
    rec.start();
  };

  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  // Group tasks
  const active = tasks.filter((t) => t.status === 'active');
  const high = active.filter((t) => t.urgency === 'critical');
  const med  = active.filter((t) => t.urgency === 'high');
  const low  = active.filter((t) => t.urgency === 'later');

  const todayKey = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toDateString();

  // Build previous tasks groups (recently created/completed, excluding today's active priority cards)
  const previous = [...tasks]
    .filter((t) => t.status !== 'active' || new Date(t.created_at).toDateString() !== todayKey || true)
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime());

  const groups: Record<string, Task[]> = {};
  previous.forEach((t) => {
    const d = new Date(t.completed_at || t.created_at);
    const key = d.toDateString();
    let label: string;
    if (key === todayKey) label = 'Today';
    else if (key === yKey) label = 'Yesterday';
    else label = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  const groupOrder = Object.keys(groups).slice(0, 6);

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* ───────── AI INPUT ───────── */}
        <form
          onSubmit={handleSubmit}
          className={`glass-elevated anim-fade-up ${aiLoading ? 'ai-thinking' : ''}`}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <input
              type="text"
              value={recording ? interim : input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Add a task or talk to Pulse AI — try "I have a meeting at 3, report due tonight, plan my day"'
              className="flex-1 bg-transparent border-0 outline-none text-[13px] text-white/90 placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={toggleRecording}
              className="relative w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all"
              style={{
                background: recording ? 'rgba(239,68,68,0.15)' : 'rgba(79,142,247,0.15)',
                border: `1px solid ${recording ? 'rgba(239,68,68,0.5)' : 'rgba(79,142,247,0.25)'}`,
                color: recording ? '#ef4444' : '#4f8ef7',
              }}
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
              {recording && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 rec-dot" />
              )}
            </button>
          </div>

          <div className="border-t border-white/5 px-4 py-2 flex items-center gap-2 flex-wrap">
            {QUICK_CMDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => setInput(cmd.replace('/ ', '') + ' ')}
                className="glass-input px-2.5 py-1 text-[11px] text-white/55 hover:text-white/85 hover:border-[rgba(79,142,247,0.3)] rounded-lg"
              >
                {cmd}
              </button>
            ))}
            {recording && (
              <span className="ml-auto text-[11px] text-white/40">Listening…</span>
            )}
            {aiLoading && aiStatusMessage && !recording && (
              <span className="ml-auto text-[11px] text-[#4f8ef7]">{aiStatusMessage}</span>
            )}
          </div>
        </form>

        {/* ───────── TODAY'S TASKS ───────── */}
        <section className="anim-fade-up delay-100">
          <h2 className="text-[18px] font-medium text-white/90 mb-4">Today's tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <PriorityColumn
              title="High priority"
              dotClass="dot dot-red"
              hoverBorder="rgba(239,68,68,0.25)"
              hoverBg="rgba(239,68,68,0.05)"
              dotColor="dot-red"
              tasks={high}
              toggleComplete={toggleComplete}
              onAdd={(t) => submit(`${t} (critical)`)}
            />
            <PriorityColumn
              title="Medium priority"
              dotClass="dot dot-amber"
              hoverBorder="rgba(245,158,11,0.25)"
              hoverBg="rgba(245,158,11,0.05)"
              dotColor="dot-amber"
              tasks={med}
              toggleComplete={toggleComplete}
              onAdd={(t) => submit(`${t} (high)`)}
            />
            <PriorityColumn
              title="Low priority"
              dotClass="dot dot-green"
              hoverBorder="rgba(34,197,94,0.25)"
              hoverBg="rgba(34,197,94,0.05)"
              dotColor="dot-green"
              tasks={low}
              toggleComplete={toggleComplete}
              onAdd={(t) => submit(`${t} (later)`)}
            />
          </div>
        </section>

        {/* ───────── PREVIOUS TASKS ───────── */}
        <section className="anim-fade-up delay-200 pb-12">
          <h2 className="text-[18px] font-medium text-white/90 mb-4">Previous tasks</h2>

          {groupOrder.length === 0 && (
            <div className="glass p-6 text-[12px] text-white/40 text-center">
              No previous tasks yet.
            </div>
          )}

          <div className="flex flex-col gap-5">
            {groupOrder.map((label) => (
              <div key={label} className="flex gap-5">
                <div className="min-w-[80px] pt-2.5 text-[13px] font-medium text-white/40">
                  {label}
                </div>
                <div className="flex-1 glass px-3 py-1.5">
                  {groups[label].map((t, i) => {
                    const done = t.status === 'done';
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 py-2 ${
                          i !== groups[label].length - 1 ? 'border-b border-white/[0.04]' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleComplete(t.id)}
                          className="shrink-0 w-[15px] h-[15px] rounded-[3px] flex items-center justify-center transition-all"
                          style={{
                            background: done ? '#2563eb' : 'transparent',
                            border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          {done && <Check className="w-[9px] h-[9px] text-white stroke-[3]" />}
                        </button>
                        <span
                          className="text-[12px]"
                          style={{
                            color: done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
                            textDecoration: done ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ───────── Priority Column ───────── */
function PriorityColumn({
  title,
  dotClass,
  hoverBorder,
  hoverBg,
  dotColor,
  tasks,
  toggleComplete,
  onAdd,
}: {
  title: string;
  dotClass: string;
  hoverBorder: string;
  hoverBg: string;
  dotColor: string;
  tasks: Task[];
  toggleComplete: (id: string) => void;
  onAdd: (text: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState('');

  return (
    <div className="glass p-4 flex flex-col gap-3 min-h-[200px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/85">{title}</span>
        <span className={dotClass} />
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleComplete(t.id)}
            className="group glass-input flex items-center gap-2.5 px-3 py-2.5 text-left hover:-translate-y-px transition-all"
            style={{ borderRadius: 8 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = hoverBorder;
              (e.currentTarget as HTMLElement).style.background = hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '';
              (e.currentTarget as HTMLElement).style.background = '';
            }}
          >
            <span className={`dot ${dotColor}`} style={{ width: 5, height: 5 }} />
            <span className="text-[12px] text-white/65 flex-1 truncate">{t.title}</span>
          </button>
        ))}

        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (val.trim()) {
                onAdd(val.trim());
                setVal('');
                setAdding(false);
              }
            }}
          >
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onBlur={() => { if (!val.trim()) setAdding(false); }}
              placeholder="Task title…"
              className="glass-input w-full px-3 py-2 text-[12px]"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-1 py-1.5 text-[12px] text-white/25 hover:text-white/55 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}
