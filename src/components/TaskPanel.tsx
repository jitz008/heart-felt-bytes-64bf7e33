import React, { useState } from 'react';
import { 
  Plus, Sparkles, X, ChevronDown, ChevronRight, 
  Check, Star, Clock, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, ChecklistItem } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  activeList: string;
  activeTab: 'all' | 'today' | 'week' | 'starred' | 'dayplan' | 'habits';
  aiLoading: boolean;
  aiStep: string;
  aiStepsHistory: string[];
  toggleStar: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  deleteTask: (id: string) => void;
  addTaskNatural: (input: string) => void;
  breakTaskDown: (id: string) => void;
  rescueTask: (id: string) => void;
  darkMode: boolean;
  isLiveAI: boolean;
  aiStatusMessage?: string;
  searchQuery: string;
  syncGoogleTasks?: () => Promise<void>;
  isSyncingGoogleTasks?: boolean;
  accessToken?: string | null;
  signInWithGoogle?: () => Promise<any>;
  googleTasksError?: string | null;
  googleCalendarError?: string | null;
}

export default function TaskPanel({
  tasks,
  activeList,
  activeTab,
  aiLoading,
  aiStep,
  aiStepsHistory,
  toggleStar,
  toggleComplete,
  toggleChecklistItem,
  deleteTask,
  addTaskNatural,
  breakTaskDown,
  rescueTask,
  darkMode,
  isLiveAI,
  aiStatusMessage,
  searchQuery,
  syncGoogleTasks,
  isSyncingGoogleTasks,
  accessToken,
  signInWithGoogle,
  googleTasksError,
  googleCalendarError
}: TaskPanelProps) {
  const [inlineInput, setInlineInput] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Kanban-specific inline adding states
  const [addingColumn, setAddingColumn] = useState<'critical' | 'high' | 'later' | null>(null);
  const [columnInput, setColumnInput] = useState('');

  // Accordion for completed tasks
  const [expandCompleted, setExpandCompleted] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineInput.trim()) {
      addTaskNatural(inlineInput.trim());
      setInlineInput('');
    }
  };

  const handleAddColumnTask = (e: React.FormEvent, urgency: 'critical' | 'high' | 'later') => {
    e.preventDefault();
    if (columnInput.trim()) {
      const suffix = urgency === 'critical' ? 'critical' : (urgency === 'high' ? 'high' : 'later');
      addTaskNatural(`${columnInput.trim()} ${suffix}`);
      setColumnInput('');
      setAddingColumn(null);
    }
  };

  // Filter tasks based on active list, tab, and search query
  const getFilteredTasks = () => {
    let listTasks = tasks;

    if (activeTab === 'starred') {
      listTasks = tasks.filter(t => t.starred);
    } else {
      listTasks = tasks.filter(t => t.list === activeList);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      listTasks = listTasks.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.reasoning && t.reasoning.toLowerCase().includes(q)) ||
        (t.list && t.list.toLowerCase().includes(q))
      );
    }

    return listTasks;
  };

  const filteredTasks = getFilteredTasks();
  
  // Grouping active tasks by urgency for Kanban
  const criticalTasks = filteredTasks.filter(t => t.status === 'active' && t.urgency === 'critical');
  const highTasks = filteredTasks.filter(t => t.status === 'active' && t.urgency === 'high');
  const laterTasks = filteredTasks.filter(t => t.status === 'active' && t.urgency === 'later');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'work': return 'text-[#8ab4f8] dark:text-[#8ab4f8]';
      case 'study': return 'text-[#c5a3ff] dark:text-[#c5a3ff]';
      case 'finance': return 'text-amber-500 dark:text-[#fde047]';
      case 'health': return 'text-emerald-500 dark:text-[#6ee7b7]';
      default: return darkMode ? 'text-white/40' : 'text-slate-400';
    }
  };

  return (
    <div 
      id="center-task-panel"
      className="flex-1 h-full flex flex-col pt-5 px-6 overflow-hidden transition-colors duration-200 bg-transparent"
    >
      {/* Header Selector */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
          <h1 
            id="task-panel-title"
            className={`text-xl font-bold tracking-tight font-sans flex items-center gap-2 ${
              darkMode ? 'text-[#e6edf3]' : 'text-slate-900'
            }`}
          >
            {activeTab === 'starred' ? 'Starred' : activeList}
          </h1>
          <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-white/50' : 'text-slate-400'}`} />
        </div>

        {/* Connection and Sync Status */}
        <div className="flex items-center gap-4 text-[11px]">
          {accessToken && syncGoogleTasks ? (
            <button
              onClick={syncGoogleTasks}
              disabled={isSyncingGoogleTasks}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50' 
                  : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 disabled:opacity-50'
              }`}
              title="Sync tasks with Google Tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogleTasks ? 'animate-spin' : ''}`} />
              <span>{isSyncingGoogleTasks ? 'Syncing...' : 'Sync Google Tasks'}</span>
            </button>
          ) : signInWithGoogle ? (
            <button
              onClick={signInWithGoogle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
              }`}
              title="Authorize access to Google Calendar & Google Tasks"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </button>
          ) : null}

          <div className={`flex items-center gap-1.5 ${darkMode ? 'text-white/40' : 'text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] gemini-dot" />
            <span>{isLiveAI ? 'Live Gemini active' : 'AI Sandbox active'}</span>
          </div>
        </div>
      </div>

      {googleTasksError && (
        <div className={`mb-4 p-3 rounded-lg border text-xs flex flex-col gap-1.5 shrink-0 ${
          darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Google Tasks Sync Required Setup</span>
          </div>
          <p className="opacity-90">{googleTasksError}</p>
          <div className="flex items-center gap-2.5 mt-1">
            <a 
              href="https://console.developers.google.com/apis/api/tasks.googleapis.com/overview"
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold underline hover:opacity-80"
            >
              Enable Tasks API in Google Cloud Console
            </a>
            <span>•</span>
            <button 
              onClick={syncGoogleTasks}
              className="font-semibold underline hover:opacity-80 cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        </div>
      )}

      {googleCalendarError && (
        <div className={`mb-4 p-3 rounded-lg border text-xs flex flex-col gap-1.5 shrink-0 ${
          darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-750'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Google Calendar Sync Alert</span>
          </div>
          <p className="opacity-90">{googleCalendarError}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-16 flex flex-col gap-5">
        
        {/* Modern Inline "Add a Task" Google Tasks bar */}
        <form 
          onSubmit={handleAddTask} 
          className={`shrink-0 transition-all rounded-xl p-[1.5px] mb-2 ${
            darkMode 
              ? 'bg-white/6 border border-white/10 focus-within:border-[#1a73e8]/50' 
              : 'bg-white border border-slate-200 shadow-sm focus-within:border-[#1a73e8]/50 focus-within:shadow-[0_0_12px_rgba(26,115,232,0.1)]'
          }`}
        >
          <div className="flex items-center gap-3 px-3 py-1.5">
            <Plus className={`w-4 h-4 shrink-0 ${darkMode ? 'text-white/40' : 'text-slate-450'}`} />
            <input
              id="inline-add-task-input"
              type="text"
              required
              placeholder="Ask Gemini to add/schedule a task (e.g., File expense report critical)..."
              value={inlineInput}
              onChange={(e) => setInlineInput(e.target.value)}
              className={`flex-1 text-xs bg-transparent outline-none py-1 font-sans ${
                darkMode ? 'text-[#e6edf3] placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className={`p-1 rounded-full transition-all cursor-pointer flex items-center justify-center w-6 h-6 ${
                darkMode ? 'hover:bg-white/6' : 'hover:bg-slate-100'
              }`}
              title="AI Smart Parse"
            >
              {inlineInput.trim() !== '' ? (
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-t-transparent animate-spin"
                  style={{
                    borderColor: '#8ab4f8',
                    borderTopColor: '#c5a3ff'
                  }}
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
              )}
            </button>
          </div>
        </form>

        {/* AI Parsing Agent Trace */}
        <AnimatePresence>
          {aiLoading && (
            <motion.div 
              id="agent-trace-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-l-2 border-[#10b981] py-3.5 px-4 rounded-r-xl border ${
                darkMode 
                  ? 'bg-white/2 border-white/6 text-white' 
                  : 'bg-emerald-50/30 border-emerald-150 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#10b981] font-sans flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#fde047]" />
                  Gemini Agent Dispatching
                </h4>
              </div>

              <div className={`flex flex-col gap-1.5 font-mono text-[10px] ${darkMode ? 'text-white/60' : 'text-slate-650'}`}>
                {aiStepsHistory.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#10b981]">✓</span>
                    <span>{step}</span>
                  </div>
                ))}
                {aiStep && (
                  <div className={`flex items-center gap-2 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <div className="w-1 h-1 bg-[#10b981] rounded-full animate-bounce shrink-0" />
                    <span>{aiStep}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Board Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-1 select-none">
          
          {/* COLUMN 1: HIGH PRIORITY */}
          <div 
            id="kanban-col-high"
            className={`rounded-xl p-3 border backdrop-blur-md flex flex-col gap-2 min-h-[360px] transition-colors ${
              darkMode 
                ? 'bg-white/2 border-red-500/15' 
                : 'bg-red-50/10 border-red-100 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-2 px-1 border-b mb-1 ${
              darkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  High priority
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                darkMode ? 'text-red-300/80 bg-red-500/10' : 'text-red-700 bg-red-100/60'
              }`}>
                {criticalTasks.length}
              </span>
            </div>

            {/* Task list */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-0.5">
              {criticalTasks.map(task => (
                <KanbanTaskCard 
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  getCategoryColor={getCategoryColor}
                  toggleStar={toggleStar}
                  toggleComplete={toggleComplete}
                  toggleChecklistItem={toggleChecklistItem}
                  deleteTask={deleteTask}
                  breakTaskDown={breakTaskDown}
                  rescueTask={rescueTask}
                  darkMode={darkMode}
                />
              ))}

              {/* Inline adding form */}
              {addingColumn === 'critical' ? (
                <form 
                  onSubmit={(e) => handleAddColumnTask(e, 'critical')}
                  className={`p-2 rounded-lg border flex items-center gap-2 ${
                    darkMode ? 'bg-white/4 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <input 
                    type="text"
                    required
                    placeholder="Enter high task..."
                    value={columnInput}
                    onChange={(e) => setColumnInput(e.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${
                      darkMode ? 'text-[#e6edf3] placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setAddingColumn(null)}
                    className={`p-0.5 rounded-full transition-all cursor-pointer ${
                      darkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-450 hover:text-slate-850'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAddingColumn('critical');
                    setColumnInput('');
                  }}
                  className={`py-1.5 px-3 rounded-lg border border-dashed transition-all text-xs font-medium text-center cursor-pointer mt-1 ${
                    darkMode 
                      ? 'border-white/5 text-white/30 hover:text-white/60 hover:bg-white/2 hover:border-white/10' 
                      : 'border-slate-200 text-slate-400 hover:text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 2: MEDIUM PRIORITY */}
          <div 
            id="kanban-col-medium"
            className={`rounded-xl p-3 border backdrop-blur-md flex flex-col gap-2 min-h-[360px] transition-colors ${
              darkMode 
                ? 'bg-white/2 border-amber-500/15' 
                : 'bg-amber-50/10 border-amber-100 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-2 px-1 border-b mb-1 ${
              darkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  Medium priority
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                darkMode ? 'text-amber-300/80 bg-amber-500/10' : 'text-amber-700 bg-amber-100/60'
              }`}>
                {highTasks.length}
              </span>
            </div>

            {/* Task list */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-0.5">
              {highTasks.map(task => (
                <KanbanTaskCard 
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  getCategoryColor={getCategoryColor}
                  toggleStar={toggleStar}
                  toggleComplete={toggleComplete}
                  toggleChecklistItem={toggleChecklistItem}
                  deleteTask={deleteTask}
                  breakTaskDown={breakTaskDown}
                  rescueTask={rescueTask}
                  darkMode={darkMode}
                />
              ))}

              {/* Inline adding form */}
              {addingColumn === 'high' ? (
                <form 
                  onSubmit={(e) => handleAddColumnTask(e, 'high')}
                  className={`p-2 rounded-lg border flex items-center gap-2 ${
                    darkMode ? 'bg-white/4 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <input 
                    type="text"
                    required
                    placeholder="Enter medium task..."
                    value={columnInput}
                    onChange={(e) => setColumnInput(e.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${
                      darkMode ? 'text-[#e6edf3] placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setAddingColumn(null)}
                    className={`p-0.5 rounded-full transition-all cursor-pointer ${
                      darkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-450 hover:text-slate-850'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAddingColumn('high');
                    setColumnInput('');
                  }}
                  className={`py-1.5 px-3 rounded-lg border border-dashed transition-all text-xs font-medium text-center cursor-pointer mt-1 ${
                    darkMode 
                      ? 'border-white/5 text-white/30 hover:text-white/60 hover:bg-white/2 hover:border-white/10' 
                      : 'border-slate-200 text-slate-400 hover:text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>

          {/* COLUMN 3: LOW PRIORITY */}
          <div 
            id="kanban-col-later"
            className={`rounded-xl p-3 border backdrop-blur-md flex flex-col gap-2 min-h-[360px] transition-colors ${
              darkMode 
                ? 'bg-white/2 border-emerald-500/15' 
                : 'bg-emerald-50/10 border-emerald-100 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-2 px-1 border-b mb-1 ${
              darkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}>
                  Low priority
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                darkMode ? 'text-emerald-300/80 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-100/60'
              }`}>
                {laterTasks.length}
              </span>
            </div>

            {/* Task list */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-0.5">
              {laterTasks.map(task => (
                <KanbanTaskCard 
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  getCategoryColor={getCategoryColor}
                  toggleStar={toggleStar}
                  toggleComplete={toggleComplete}
                  toggleChecklistItem={toggleChecklistItem}
                  deleteTask={deleteTask}
                  breakTaskDown={breakTaskDown}
                  rescueTask={rescueTask}
                  darkMode={darkMode}
                />
              ))}

              {/* Inline adding form */}
              {addingColumn === 'later' ? (
                <form 
                  onSubmit={(e) => handleAddColumnTask(e, 'later')}
                  className={`p-2 rounded-lg border flex items-center gap-2 ${
                    darkMode ? 'bg-white/4 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <input 
                    type="text"
                    required
                    placeholder="Enter low task..."
                    value={columnInput}
                    onChange={(e) => setColumnInput(e.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${
                      darkMode ? 'text-[#e6edf3] placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setAddingColumn(null)}
                    className={`p-0.5 rounded-full transition-all cursor-pointer ${
                      darkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-450 hover:text-slate-850'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAddingColumn('later');
                    setColumnInput('');
                  }}
                  className={`py-1.5 px-3 rounded-lg border border-dashed transition-all text-xs font-medium text-center cursor-pointer mt-1 ${
                    darkMode 
                      ? 'border-white/5 text-white/30 hover:text-white/60 hover:bg-white/2 hover:border-white/10' 
                      : 'border-slate-200 text-slate-400 hover:text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>

        </div>

        {/* COMPLETED TASKS ACCORDION (Below Kanban) */}
        {completedTasks.length > 0 && (
          <div id="group-completed" className="flex flex-col mt-4">
            <div 
              onClick={() => setExpandCompleted(!expandCompleted)}
              className={`flex items-center gap-2 py-2 cursor-pointer select-none transition-colors ${
                darkMode ? 'text-white/45 hover:text-white/70' : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              {expandCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-xs font-semibold uppercase tracking-wider">
                Completed ({completedTasks.length})
              </span>
            </div>

            <AnimatePresence>
              {expandCompleted && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex flex-col border-t mt-1.5 pt-2.5 gap-4 ${
                    darkMode ? 'border-white/6' : 'border-slate-100'
                  }`}
                >
                  {Object.entries(
                    completedTasks.reduce((groups: { [key: string]: Task[] }, task) => {
                      let dateStr = 'Yesterday • Oct 14';
                      if (task.completed_at) {
                        const date = new Date(task.completed_at);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        
                        if (date.toDateString() === today.toDateString()) {
                          dateStr = 'Today';
                        } else if (date.toDateString() === yesterday.toDateString()) {
                          dateStr = 'Yesterday • ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } else {
                          const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
                          const formatted = date.toLocaleDateString('en-US', options);
                          dateStr = formatted.replace(',', ' •');
                        }
                      }
                      if (!groups[dateStr]) groups[dateStr] = [];
                      groups[dateStr].push(task);
                      return groups;
                    }, {})
                  ).map(([dateGroup, groupTasks]) => (
                    <div key={dateGroup} className="flex flex-col gap-1.5">
                      {/* Date Group Header */}
                      <span className={`text-[10px] font-bold tracking-wide font-sans pl-1 ${
                        darkMode ? 'text-white/30' : 'text-slate-450'
                      }`}>
                        {dateGroup}
                      </span>

                      {/* Checklist rows */}
                      <div className="flex flex-col gap-0.5">
                        {groupTasks.map(task => (
                          <div 
                            key={task.id}
                            className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all ${
                              darkMode ? 'hover:bg-white/2' : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Left: simple gray circular checkmark with check icon */}
                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                                darkMode ? 'bg-white/10 hover:bg-white/18 text-white/50' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                            
                            {/* Center: task title with strike-through line, and category color dot */}
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className={`text-xs line-through truncate font-sans ${
                                darkMode ? 'text-white/55' : 'text-slate-400'
                              }`}>
                                {task.title}
                              </span>
                              {/* Category color dot */}
                              <span 
                                className="w-1.5 h-1.5 rounded-full shrink-0" 
                                style={{
                                  backgroundColor: task.category === 'work' ? '#8ab4f8' : (task.category === 'study' ? '#c5a3ff' : (task.category === 'finance' ? '#f59e0b' : '#10b981'))
                                }}
                              />
                            </div>

                            {/* Right: "X" to delete */}
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className={`p-1 hover:text-red-500 transition-colors cursor-pointer ${
                                darkMode ? 'text-white/20 hover:text-white/50' : 'text-slate-300 hover:text-slate-600'
                              }`}
                              title="Delete Completed Task"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}

// 2.0 KANBAN CARD SUB-COMPONENT
interface KanbanTaskCardProps {
  key?: string;
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getCategoryColor: (cat: string) => string;
  toggleStar: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  deleteTask: (id: string) => void;
  breakTaskDown: (id: string) => void;
  rescueTask: (id: string) => void;
  darkMode: boolean;
}

function KanbanTaskCard({
  task,
  isExpanded,
  onToggleExpand,
  getCategoryColor,
  toggleStar,
  toggleComplete,
  toggleChecklistItem,
  deleteTask,
  breakTaskDown,
  rescueTask,
  darkMode
}: KanbanTaskCardProps) {
  return (
    <div 
      onClick={onToggleExpand}
      className={`group flex flex-col rounded-lg border p-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] ${
        darkMode 
          ? `bg-white/4 border-white/6 hover:bg-white/8 hover:border-white/12 ${isExpanded ? 'bg-white/6 border-white/12' : ''}` 
          : `bg-white border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm ${isExpanded ? 'bg-slate-50 border-slate-300' : ''}`
      }`}
    >
      {/* Top row: Title and star */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0">
          {/* Quick Complete Circle checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(task.id);
            }}
            className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all hover:border-[#10b981] cursor-pointer ${
              darkMode ? 'border-white/30' : 'border-slate-350 bg-white'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#10b981] scale-0 group-hover:scale-100 transition-transform" />
          </button>

          <span className={`text-[13px] leading-snug font-medium break-words ${
            darkMode ? 'text-white/85 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900 font-medium'
          }`}>
            {task.title}
          </span>
        </div>

        {/* Star icon button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(task.id);
          }}
          className={`shrink-0 p-0.5 rounded-full transition-all cursor-pointer ${
            darkMode ? 'hover:bg-white/6' : 'hover:bg-slate-150'
          } ${task.starred ? 'opacity-100' : 'opacity-25 group-hover:opacity-100'}`}
        >
          <Star className={`w-3.5 h-3.5 ${task.starred ? 'fill-amber-400 text-amber-400' : (darkMode ? 'text-white/50' : 'text-slate-450')}`} />
        </button>
      </div>

      {/* Metadata Row */}
      <div className={`flex flex-wrap items-center gap-2 mt-2 text-[10px] ${darkMode ? 'text-white/40' : 'text-slate-500 font-medium'}`}>
        {/* Category tag */}
        <span className={`capitalize font-semibold ${getCategoryColor(task.category)}`}>
          {task.category}
        </span>

        {/* Estimated time chip */}
        <span className="flex items-center gap-1 font-mono">
          <Clock className={`w-3 h-3 ${darkMode ? 'text-white/30' : 'text-slate-400'}`} />
          {task.estimated_minutes}m
        </span>

        {/* Calendar conflict warning */}
        {task.calendar_conflict && (
          <span className="text-red-500 font-bold flex items-center gap-0.5 animate-pulse">
            ⚠ Conflict
          </span>
        )}

        {/* Human friendly deadline */}
        {task.deadline_human && (
          <span className="truncate max-w-[80px]">
            • {task.deadline_human}
          </span>
        )}
      </div>

      {/* Expanded Actions & Checklist Panel */}
      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`mt-3.5 pt-3 border-t flex flex-col gap-3 ${
            darkMode ? 'border-white/6' : 'border-slate-200'
          }`}
        >
          {/* AI dynamic sorting reasoning quote */}
          {task.reasoning && (
            <div className={`text-[11px] italic pl-2 border-l border-[#10b981]/50 font-sans leading-relaxed ${
              darkMode ? 'text-white/50' : 'text-slate-500'
            }`}>
              "AI: {task.reasoning}"
            </div>
          )}

          {/* Checklist Block */}
          {task.checklist && task.checklist.length > 0 && (
            <div className={`flex flex-col gap-2 p-2.5 rounded-lg border ${
              darkMode ? 'bg-white/2 border-white/6' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[#10b981] uppercase">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  Checklist ({task.checklist.filter(c => c.is_done).length}/{task.checklist.length})
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.is_done}
                      id={`checklist-box-${item.id}`}
                      onChange={() => toggleChecklistItem(task.id, item.id)}
                      className={`w-3.5 h-3.5 rounded text-[#1a73e8] focus:ring-offset-0 bg-transparent shrink-0 outline-none cursor-pointer ${
                        darkMode ? 'border-white/20' : 'border-slate-300'
                      }`}
                    />
                    <span 
                      className={`text-[11px] leading-normal ${
                        item.is_done 
                          ? `line-through ${darkMode ? 'text-white/40' : 'text-slate-400'}` 
                          : `${darkMode ? 'text-white/70' : 'text-slate-700 font-medium'}`
                      }`}
                    >
                      {item.step}
                      <span className={`text-[9px] font-mono ml-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>({item.minutes}m)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <div className="flex items-center gap-3">
              {/* Break down */}
              <button
                onClick={() => breakTaskDown(task.id)}
                className="text-[#1a73e8] dark:text-[#8ab4f8] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-400 dark:text-[#fca5a5] animate-pulse" />
                Break down
              </button>

              <span className={darkMode ? 'text-white/20' : 'text-slate-200'}>|</span>
              
              {/* Rescue */}
              <button
                onClick={() => rescueTask(task.id)}
                className="text-emerald-500 dark:text-emerald-450 hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <AlertCircle className="w-3 h-3 text-emerald-500" />
                Rescue me
              </button>
            </div>
            
            {/* Delete */}
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 dark:text-[#fca5a5] hover:text-red-600 dark:hover:text-[#ff7b72] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
