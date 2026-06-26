import React, { useState } from 'react';
import { BarChart2, Flame, Sparkles, TrendingUp, Trophy, Heart, Activity } from 'lucide-react';
import { Task, PulseScore } from '../types';

interface HabitDashboardProps {
  tasks: Task[];
  pulseScore: PulseScore;
  darkMode: boolean;
}

export default function HabitDashboard({
  tasks,
  pulseScore,
  darkMode
}: HabitDashboardProps) {
  const [timeframe, setTimeframe] = useState<'7' | '15' | '30'>('7');

  // Simulated metrics based on selected timeframe
  const getMetrics = () => {
    switch (timeframe) {
      case '15':
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 8,
          onTimeRate: 84,
          avgDaily: 2.1,
          longestStreak: 8,
          completions: [1, 2, 0, 3, 1, 2, 1, 2, 3, 0, 1, 2, 4, 1, 2],
          labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15']
        };
      case '30':
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 18,
          onTimeRate: 81,
          avgDaily: 1.9,
          longestStreak: 12,
          completions: [2, 1, 2, 0, 3, 1, 2, 1, 2, 3, 0, 1, 2, 4, 1, 2, 1, 3, 2, 0, 1, 2, 2, 1, 3, 1, 0, 2, 3, 2],
          labels: Array.from({ length: 30 }, (_, i) => `D${i+1}`)
        };
      case '7':
      default:
        return {
          completedCount: tasks.filter(t => t.status === 'done').length + 3,
          onTimeRate: 82,
          avgDaily: 1.5,
          longestStreak: 5,
          completions: [2, 1, 3, 0, 2, 1, 2],
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        };
    }
  };

  const metrics = getMetrics();
  const maxCompletionVal = Math.max(...metrics.completions, 4);

  // SVG Circular progress bar values
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pulseScore.score / 100) * circumference;

  return (
    <div 
      id="habit-analytics-dashboard"
      className="flex-1 h-full flex flex-col pt-6 px-6 overflow-hidden select-none bg-transparent"
    >
      {/* Header */}
      <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <h1 
            className={`text-xl font-bold tracking-tight font-sans flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Habit Tracker
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-normal bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase font-bold shadow-sm">
              Cognitive Performance
            </span>
          </h1>
          <span className={`text-xs mt-1 uppercase tracking-wider font-sans font-semibold ${
            darkMode ? 'text-white/45' : 'text-slate-500'
          }`}>
            Real-time telemetry and task execution velocity
          </span>
        </div>

        {/* Timeframe Selector in glass styling */}
        <div 
          className={`flex items-center gap-1 p-0.5 rounded-xl border text-xs font-bold uppercase transition-all self-start md:self-auto shrink-0 ${
            darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-slate-100/60'
          }`}
        >
          {(['7', '15', '30'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className="px-3 py-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
              style={{
                backgroundColor: timeframe === t ? (darkMode ? 'rgba(255,255,255,0.08)' : '#ffffff') : 'transparent',
                color: timeframe === t ? (darkMode ? '#10b981' : '#059669') : (darkMode ? 'rgba(255,255,255,0.4)' : '#64748b'),
                boxShadow: timeframe === t && !darkMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {t} Days
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 pb-24">
        
        {/* Row 1: Left Circular Meter & Right Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          
          {/* Bento 1: Circular Pulse Score Gauge */}
          <div 
            className={`p-5 rounded-xl border backdrop-blur-md flex flex-col items-center justify-center text-center relative shadow-sm transition-all ${
              darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
            }`}
          >
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest absolute top-3 left-3 flex items-center gap-1.5 ${
              darkMode ? 'text-white/40' : 'text-slate-450'
            }`}>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Pulse Rating
            </span>

            {/* Circular Progress Gauge with ambient backglow */}
            <div className="relative w-28 h-28 flex items-center justify-center mt-3">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="transparent"
                  stroke={darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'}
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{pulseScore.score}</span>
                <span className={`text-[8px] uppercase font-bold tracking-widest leading-none ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Rating</span>
              </div>
            </div>

            <p className={`text-[11px] italic mt-3 px-2 leading-tight ${darkMode ? 'text-white/45' : 'text-slate-550 font-medium'}`}>
              "{pulseScore.verdict}"
            </p>
          </div>

          {/* Bento 2: Quick Metrics Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            
            {/* Quick Card 1: Completed */}
            <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm ${
              darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
            }`}>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>Tasks Completed</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{metrics.completedCount}</span>
                <span className={`text-[10px] font-semibold font-mono ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>goals done</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">✓ On schedule velocity</span>
            </div>

            {/* Quick Card 2: Streaks */}
            <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm ${
              darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
            }`}>
              <span className={`text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>
                Streak Multiplier
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold font-mono text-orange-500">{pulseScore.streak}</span>
                <span className={`text-[10px] font-semibold font-mono ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>consecutive days</span>
              </div>
              <span className={`text-[9px] ${darkMode ? 'text-white/35' : 'text-slate-500'}`}>Longest streak: {metrics.longestStreak} days</span>
            </div>

            {/* Quick Card 3: On-Time Rate */}
            <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm ${
              darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
            }`}>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>On-Time Accuracy</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{metrics.onTimeRate}%</span>
                <span className={`text-[10px] font-semibold font-mono ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>accuracy</span>
              </div>
              <span className={`text-[9px] ${darkMode ? 'text-white/35' : 'text-slate-500'}`}>Industry average: 65%</span>
            </div>

            {/* Quick Card 4: Average Daily */}
            <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm ${
              darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
            }`}>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>Average Objectives</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{metrics.avgDaily}</span>
                <span className={`text-[10px] font-semibold font-mono ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>objectives/day</span>
              </div>
              <span className={`text-[9px] ${darkMode ? 'text-white/35' : 'text-slate-500'}`}>Peak hour: 10:00 AM</span>
            </div>

          </div>
        </div>

        {/* Row 2: Consistency Chart and Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          
          {/* Bento 3: 7-day consistency chart */}
          <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col shadow-sm ${
            darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
          }`}>
            <span className={`text-[9px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5 ${
              darkMode ? 'text-white/40' : 'text-slate-450'
            }`}>
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
              7-Day Consistency History
            </span>

            {/* completions timeline using SVG bars */}
            <div className={`flex items-end justify-between h-32 px-1 border-b pb-1.5 ${
              darkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              {metrics.completions.map((count, index) => {
                const percentage = (count / maxCompletionVal) * 100;
                return (
                  <div key={index} className="flex flex-col items-center gap-1 flex-1 group relative">
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-zinc-900 border border-white/5 text-slate-100 text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none transition-opacity z-10 shadow-md">
                      {count} goals
                    </div>

                    <div className={`w-5 rounded-t h-24 flex items-end overflow-hidden ${
                      darkMode ? 'bg-white/3' : 'bg-slate-100'
                    }`}>
                      <div 
                        className="w-full bg-emerald-500 group-hover:bg-emerald-400 transition-all rounded-t"
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-mono font-bold tracking-tight ${
                      darkMode ? 'text-white/30' : 'text-slate-400'
                    }`}>
                      {metrics.labels[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bento Category Density Breakdown */}
          <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm ${
            darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
          }`}>
            <span className={`text-[9px] font-bold uppercase tracking-wide mb-3 ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>
              Task Density by Category
            </span>

            <div className="flex flex-col gap-3">
              {/* Work */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}`}>Work & Engineering</span>
                  <span className={`font-mono font-bold text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>72% efficiency</span>
                </div>
                <div className={`h-1.5 rounded overflow-hidden ${darkMode ? 'bg-white/3' : 'bg-slate-100'}`}>
                  <div className="h-full bg-emerald-500 rounded" style={{ width: '72%' }} />
                </div>
              </div>

              {/* Study */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}`}>Study & Reading</span>
                  <span className={`font-mono font-bold text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>85% efficiency</span>
                </div>
                <div className={`h-1.5 rounded overflow-hidden ${darkMode ? 'bg-white/3' : 'bg-slate-100'}`}>
                  <div className="h-full bg-emerald-400 rounded" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Personal */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}`}>Personal & Health</span>
                  <span className={`font-mono font-bold text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>55% efficiency</span>
                </div>
                <div className={`h-1.5 rounded overflow-hidden ${darkMode ? 'bg-white/3' : 'bg-slate-100'}`}>
                  <div className="h-full bg-emerald-600 rounded" style={{ width: '55%' }} />
                </div>
              </div>

              {/* Finance */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}`}>Finance & Payments</span>
                  <span className={`font-mono font-bold text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-450'}`}>92% efficiency</span>
                </div>
                <div className={`h-1.5 rounded overflow-hidden ${darkMode ? 'bg-white/3' : 'bg-slate-100'}`}>
                  <div className="h-full bg-emerald-500 rounded" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bento 4: Dynamic Recommendations from Gemini */}
        <div 
          className={`p-4 rounded-xl border backdrop-blur-md shrink-0 shadow-sm ${
            darkMode ? 'border-white/6 bg-white/3' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Gemini Habit Patterns & Recommendations
            </span>
          </div>

          <div className={`flex flex-col gap-2 font-sans text-xs leading-relaxed ${darkMode ? 'text-white/55' : 'text-slate-600'}`}>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">•</span>
              <p>You complete <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>78% of study tasks</strong> on time but only <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>52% of work tasks</strong>. Keep your focus blocks clean.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">•</span>
              <p>Your most productive window is <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>9:00 AM – 11:00 AM</strong>. Block these hours for Critical objectives.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">•</span>
              <p>You've completed <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>3 tasks in a row</strong> before noon — keep going to hit your daily goal!</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
