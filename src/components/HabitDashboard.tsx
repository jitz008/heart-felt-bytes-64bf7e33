import React, { useState, useEffect } from 'react';
import { BarChart2, Flame, Sparkles, Activity, Plus, X, RefreshCw, Trash2 } from 'lucide-react';
import { Task, PulseScore } from '../types';
import DonutChart from './ui/donut-chart';
import { useHabits, habitStreak } from '../hooks/useHabits';

interface HabitDashboardProps {
  tasks: Task[];
  pulseScore: PulseScore;
  darkMode: boolean;
  userId: string | null;
  isFirebase: boolean;
}

export default function HabitDashboard({ tasks, pulseScore, userId, isFirebase }: HabitDashboardProps) {
  const [timeframe, setTimeframe] = useState<'7' | '15' | '30'>('7');
  const {
    habits, suggestions, suggestLoading, suggestError,
    refreshSuggestions, acceptHabit, dismissSuggestion, removeHabit,
  } = useHabits(userId, isFirebase);

  // Auto-fetch suggestions on first mount when we have tasks but no habits yet
  useEffect(() => {
    if (tasks.length > 0 && habits.length === 0 && suggestions.length === 0 && !suggestLoading) {
      refreshSuggestions(tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, habits.length]);

  const getMetrics = () => {
    switch (timeframe) {
      case '15':
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 8,
          onTimeRate: 84,
          avgDaily: 2.1,
          longestStreak: 8,
          completions: [1, 2, 0, 3, 1, 2, 1, 2, 3, 0, 1, 2, 4, 1, 2],
          labels: Array.from({ length: 15 }, (_, i) => `D${i + 1}`),
        };
      case '30':
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 18,
          onTimeRate: 81,
          avgDaily: 1.9,
          longestStreak: 12,
          completions: [2,1,2,0,3,1,2,1,2,3,0,1,2,4,1,2,1,3,2,0,1,2,2,1,3,1,0,2,3,2],
          labels: Array.from({ length: 30 }, (_, i) => `D${i + 1}`),
        };
      default:
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 3,
          onTimeRate: 82,
          avgDaily: 1.5,
          longestStreak: 5,
          completions: [2, 1, 3, 0, 2, 1, 2],
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        };
    }
  };

  const metrics = getMetrics();
  const maxCompletionVal = Math.max(...metrics.completions, 4);

  // Subtle background grid-dot pattern (matches reference header)
  const dotGrid: React.CSSProperties = {
    backgroundImage:
      'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
    backgroundPosition: '0 0',
  };

  const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-md p-5 ${className}`}
    >
      {children}
    </div>
  );

  const Eyebrow: React.FC<React.PropsWithChildren<{ icon?: React.ReactNode }>> = ({ children, icon }) => (
    <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/40 flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );

  return (
    <div id="habit-analytics-dashboard" className="flex-1 h-full flex flex-col overflow-hidden select-none relative">
      {/* Header band with subtle dot grid */}
      <div className="relative shrink-0 px-8 pt-8 pb-6 border-b border-white/[0.05]" style={dotGrid}>
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/40 font-medium">
              Pulse · Analytics
            </span>
            <h1 className="text-3xl font-normal tracking-tight text-white/95 font-sans">
              Habit tracker
            </h1>
            <p className="text-sm text-white/45 font-light max-w-md">
              Quiet telemetry on consistency, focus windows, and execution velocity.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full border border-white/[0.06] bg-white/[0.03] self-start md:self-auto">
            {(['7', '15', '30'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium transition-colors ${
                  timeframe === t
                    ? 'bg-white/[0.08] text-white/90'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Centered vertical list of cards */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-24">

          {/* Pulse Rating — hero card with donut */}
          <Card>
            <div className="flex items-center gap-6">
              <DonutChart
                value={pulseScore.score}
                size={104}
                strokeWidth={5}
                stroke="rgba(255,255,255,0.55)"
                label={String(pulseScore.score)}
                sublabel="rating"
              />
              <div className="flex-1 flex flex-col gap-2">
                <Eyebrow icon={<Activity className="w-3 h-3" />}>Pulse rating</Eyebrow>
                <p className="text-base text-white/80 font-light leading-snug">
                  "{pulseScore.verdict}"
                </p>
                <div className="flex items-center gap-4 mt-1 text-[11px] text-white/45">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-white/55" />
                    {pulseScore.streak} day streak
                  </span>
                  <span className="text-white/20">·</span>
                  <span>longest {metrics.longestStreak}d</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick metrics — 3 across, flat dark */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="!p-4">
              <Eyebrow>Completed</Eyebrow>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-light text-white/90">{metrics.completedCount}</span>
                <span className="text-[10px] text-white/35">goals</span>
              </div>
            </Card>
            <Card className="!p-4">
              <Eyebrow>On-time</Eyebrow>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-light text-white/90">{metrics.onTimeRate}%</span>
                <span className="text-[10px] text-white/35">accuracy</span>
              </div>
            </Card>
            <Card className="!p-4">
              <Eyebrow>Average</Eyebrow>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-light text-white/90">{metrics.avgDaily}</span>
                <span className="text-[10px] text-white/35">/ day</span>
              </div>
            </Card>
          </div>

          {/* Your habits — auto-derived from task history */}
          {habits.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow icon={<Flame className="w-3 h-3" />}>Your habits · last 7 days</Eyebrow>
                <button
                  onClick={() => refreshSuggestions(tasks)}
                  className="text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-white/70 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> suggest more
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {habits.map((h) => {
                  const { done, pct } = habitStreak(h, tasks, 7);
                  const target = h.cadence === 'daily' ? 7 : h.target_per_week;
                  return (
                    <div key={h.id} className="flex flex-col gap-1.5 group">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-light flex items-center gap-2">
                          <span className="text-base leading-none">{h.emoji}</span>
                          {h.name}
                          <span className="text-white/30 text-[10px] uppercase tracking-wider">{h.cadence}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-white/35 font-mono text-[10px]">{done}/{target}</span>
                          <button
                            onClick={() => removeHabit(h.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70"
                            aria-label="Remove habit"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="h-[3px] rounded-full overflow-hidden bg-white/[0.05]">
                        <div className="h-full rounded-full bg-white/50 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Suggested by Gemini */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <Eyebrow icon={<Sparkles className="w-3 h-3" />}>
                {habits.length === 0 ? 'Plan your habits · Gemini' : 'More suggestions'}
              </Eyebrow>
              <button
                onClick={() => refreshSuggestions(tasks)}
                disabled={suggestLoading}
                className="text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-white/70 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${suggestLoading ? 'animate-spin' : ''}`} />
                {suggestLoading ? 'thinking' : 'regenerate'}
              </button>
            </div>

            {suggestError && (
              <p className="text-[11px] text-white/40 mb-3">{suggestError}</p>
            )}

            {suggestions.length === 0 && !suggestLoading && habits.length === 0 && (
              <p className="text-sm text-white/45 font-light">
                Complete a few tasks first — Gemini will read your patterns and propose habits worth tracking.
              </p>
            )}

            {suggestions.length === 0 && !suggestLoading && habits.length > 0 && (
              <p className="text-sm text-white/45 font-light">
                No new suggestions right now. Tap regenerate after completing more tasks.
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-white/85 font-light">
                      <span className="text-base leading-none">{s.emoji}</span>
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-white/30">
                        {s.cadence} · {s.target_per_week}×/wk
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{s.reason}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => acceptHabit(s)}
                      className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-white/[0.08] hover:bg-white/[0.14] text-white/85 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> add
                    </button>
                    <button
                      onClick={() => dismissSuggestion(s.id)}
                      className="p-1.5 rounded-full text-white/35 hover:text-white/70 hover:bg-white/[0.05]"
                      aria-label="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>


          {/* Consistency history */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <Eyebrow icon={<BarChart2 className="w-3 h-3" />}>Consistency · last {timeframe} days</Eyebrow>
              <span className="text-[10px] text-white/30 font-mono">peak 10:00</span>
            </div>
            <div className="flex items-end justify-between h-28 gap-1.5">
              {metrics.completions.map((count, index) => {
                const pct = (count / maxCompletionVal) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full h-24 flex items-end rounded-md overflow-hidden bg-white/[0.025]">
                      <div
                        className="w-full rounded-md bg-white/30 group-hover:bg-white/55 transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30 font-mono tracking-tight">
                      {metrics.labels[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Category density */}
          <Card>
            <Eyebrow>Task density by category</Eyebrow>
            <div className="flex flex-col gap-3.5 mt-4">
              {[
                { label: 'Work & engineering', pct: 72 },
                { label: 'Study & reading', pct: 85 },
                { label: 'Personal & health', pct: 55 },
                { label: 'Finance & payments', pct: 92 },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70 font-light">{row.label}</span>
                    <span className="text-white/35 font-mono text-[10px]">{row.pct}%</span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden bg-white/[0.05]">
                    <div className="h-full rounded-full bg-white/40" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gemini insights — pill / command styling */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <Eyebrow icon={<Sparkles className="w-3 h-3" />}>Gemini patterns</Eyebrow>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-white/55 bg-white/[0.04] border border-white/[0.06]">
                  /insights
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-white/55 bg-white/[0.04] border border-white/[0.06]">
                  /focus
                </span>
              </div>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-white/65 font-light leading-relaxed">
              <li className="flex gap-3">
                <span className="text-white/30 mt-1.5 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                You complete <span className="text-white/85 px-1">78%</span> of study tasks on time vs <span className="text-white/85 px-1">52%</span> of work tasks.
              </li>
              <li className="flex gap-3">
                <span className="text-white/30 mt-1.5 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                Most productive window is <span className="text-white/85 px-1">9–11 AM</span>. Reserve it for critical objectives.
              </li>
              <li className="flex gap-3">
                <span className="text-white/30 mt-1.5 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                You've cleared <span className="text-white/85 px-1">3 tasks</span> in a row before noon — keep going.
              </li>
            </ul>
          </Card>

        </div>
      </div>
    </div>
  );
}
