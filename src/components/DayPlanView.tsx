import React from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { Task, DayPlanBlock } from '../types';

interface DayPlanViewProps {
  tasks: Task[];
  dayPlan: DayPlanBlock[];
  toggleComplete: (id: string) => void;
  darkMode: boolean;
}

export default function DayPlanView({
  tasks,
  dayPlan,
  toggleComplete,
  darkMode
}: DayPlanViewProps) {

  // Check if a task is already completed
  const isTaskCompleted = (taskId?: string | null) => {
    if (!taskId) return false;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.status === 'done' : false;
  };

  return (
    <div 
      id="day-plan-timeline-container"
      className="flex-1 h-full flex flex-col pt-6 px-6 overflow-hidden select-none bg-transparent"
    >
      {/* Header */}
      <div className="shrink-0 mb-6">
        <h1 
          className={`text-xl font-bold tracking-tight font-sans flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Today's Plan
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-normal bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase font-bold shadow-sm animate-pulse">
            Gemini Chrono-Schedule
          </span>
        </h1>
        <p className={`text-xs mt-1 uppercase tracking-wider font-sans font-semibold ${
          darkMode ? 'text-white/45' : 'text-slate-500'
        }`}>
          AI synthesized timeline avoiding client meeting overlaps
        </p>
      </div>

      {/* Timeline List Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col pb-24">
        
        {/* Timeline block connecting line */}
        <div 
          className="relative border-l ml-4 pl-8 flex flex-col gap-6" 
          style={{ borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)' }}
        >
          
          {dayPlan.map((block, idx) => {
            const completed = isTaskCompleted(block.task_id);
            const isCalendar = block.type === 'calendar';
            const isBreak = block.type === 'break';

            const blockColor = isCalendar 
              ? '#10b981' 
              : (isBreak ? '#3b82f6' : (block.priority === 'critical' ? '#ef4444' : '#f59e0b'));

            return (
              <div key={idx} className="relative group animate-fadeIn">
                {/* Time Indicator Circle on Border Line with Ring */}
                <div 
                  className={`absolute -left-[38.5px] top-1.5 w-3 h-3 rounded-full border-2 flex items-center justify-center z-10 transition-transform group-hover:scale-125 ${
                    darkMode ? 'bg-[#0d1117]' : 'bg-white'
                  }`}
                  style={{
                    borderColor: blockColor,
                  }}
                >
                  <div 
                    className="w-1 h-1 rounded-full animate-pulse"
                    style={{
                      backgroundColor: blockColor,
                    }}
                  />
                </div>

                {/* Main Glass Bento Card */}
                <div 
                  className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-2xl ${
                    darkMode 
                      ? 'border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/12 hover:shadow-lg' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-xs hover:shadow-sm'
                  }`}
                  style={{
                    opacity: completed ? 0.55 : 1,
                  }}
                >
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {/* Time Duration Tag in JetBrains Mono */}
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                        darkMode ? 'text-white/40' : 'text-slate-500'
                      }`}>
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        {block.time} {block.end_time ? `· ${block.end_time}` : ''}
                      </span>

                      {/* Type Pill */}
                      <span 
                        className="text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider"
                        style={{
                          backgroundColor: isCalendar 
                            ? 'rgba(16,185,129,0.1)' 
                            : (isBreak ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)'),
                          color: isCalendar ? '#10b981' : (isBreak ? '#3b82f6' : '#f59e0b'),
                        }}
                      >
                        {block.type}
                      </span>

                      {/* Priority Tag */}
                      {block.priority && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#fca5a5] dark:text-[#fca5a5]">
                          · {block.priority}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 
                      className={`text-xs font-bold tracking-wide mt-1 ${
                        completed 
                          ? `line-through ${darkMode ? 'text-white/45' : 'text-slate-400'}` 
                          : `${darkMode ? 'text-[#e6edf3]' : 'text-slate-800'}`
                      }`}
                    >
                      {block.title}
                    </h3>

                    {/* AI reasoning Note */}
                    {block.note && (
                      <p className={`text-[11px] italic mt-0.5 font-sans leading-relaxed ${
                        darkMode ? 'text-white/40' : 'text-slate-500'
                      }`}>
                        AI: "{block.note}"
                      </p>
                    )}
                  </div>

                  {/* Actions (Mark done for Tasks) */}
                  {block.type === 'task' && block.task_id && (
                    <div className="shrink-0">
                      {completed ? (
                        <span className={`text-[10px] font-bold flex items-center gap-1 border px-2.5 py-1 rounded-full shadow-sm ${
                          darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-150 text-emerald-700 font-semibold'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                          Marked Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleComplete(block.task_id!)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                            darkMode 
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 shrink-0" />
                          Mark done
                        </button>
                      )}
                    </div>
                  )}

                  {/* Calendar Sync indicator */}
                  {isCalendar && (
                    <span className={`text-[9px] font-mono font-bold shrink-0 uppercase tracking-wider px-2 py-1 rounded ${
                      darkMode ? 'text-white/45 bg-white/6' : 'text-slate-550 bg-slate-100'
                    }`}>
                      Cal Sync
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
