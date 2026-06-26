import React, { useState } from 'react';
import { 
  Plus, Folder, Star, Calendar, BarChart2, 
  ChevronDown, Sparkles, CheckSquare, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PulseScore } from '../types';

interface SidebarProps {
  lists: string[];
  activeList: string;
  setActiveList: (name: string) => void;
  createList: (name: string) => void;
  activeTab: 'all' | 'today' | 'week' | 'starred' | 'dayplan' | 'habits';
  setActiveTab: (tab: 'all' | 'today' | 'week' | 'starred' | 'dayplan' | 'habits') => void;
  pulseScore: PulseScore;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isLiveAI: boolean;
}

export default function Sidebar({
  lists,
  activeList,
  setActiveList,
  createList,
  activeTab,
  setActiveTab,
  pulseScore,
  darkMode,
  setDarkMode,
  isLiveAI
}: SidebarProps) {
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listsExpanded, setListsExpanded] = useState(true);

  // Hover and click states for expansion
  const [isHovered, setIsHovered] = useState(false);
  const [isClickedExpanded, setIsClickedExpanded] = useState(false);

  const isExpanded = isHovered || isClickedExpanded;

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName('');
      setShowAddList(false);
    }
  };

  return (
    <motion.div 
      id="sidebar-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ width: 48, opacity: 0 }}
      animate={{ width: isExpanded ? 240 : 48, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`h-full flex flex-col justify-between select-none border-r relative z-40 backdrop-blur-md overflow-hidden shrink-0 transition-colors duration-200 ${
        darkMode 
          ? 'border-white/5 bg-[#0d1117]/35 text-[#e6edf3]' 
          : 'border-slate-200 bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col pt-3 overflow-hidden">
        
        {/* LOGO HEADER */}
        <div 
          onClick={() => setIsClickedExpanded(!isClickedExpanded)}
          className="flex items-center gap-3 px-2 py-3 cursor-pointer select-none shrink-0 overflow-hidden"
        >
          {/* SVG Logo circle matching Image 3 (Tasks logo) */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #4285F4 0%, #7C4DFF 100%)'
            }}
          >
            {/* White checkmark (✓) path */}
            <svg 
              className="w-4.5 h-4.5 text-white stroke-[2.5]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="flex items-center whitespace-nowrap min-w-0"
              >
                <span className={`text-lg font-bold tracking-tight font-sans ${darkMode ? 'text-[#e6edf3]' : 'text-slate-850'}`}>
                  Pulse Tasks
                </span>
                <span className="text-[10px] bg-blue-500/15 text-blue-500 dark:text-[#8ab4f8] border border-blue-500/20 rounded-[10px] px-1.5 py-0.5 ml-1.5 font-medium">
                  2.0
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Task Quick Button (Only in Expanded state for readability) */}
        <div className="px-2 mb-4 shrink-0">
          <button
            id="create-task-btn"
            onClick={() => {
              setActiveTab('all');
              setTimeout(() => {
                const addInput = document.getElementById('inline-add-task-input');
                if (addInput) addInput.focus();
              }, 50);
            }}
            className={`w-full flex items-center justify-center transition-all cursor-pointer ${
              isExpanded 
                ? `py-2 px-3 gap-2 border ${
                    darkMode 
                      ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                  } rounded-lg text-sm font-medium`
                : `h-8 w-8 p-0 border ${
                    darkMode ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                  } rounded-full`
            }`}
          >
            <Plus className="w-4 h-4" />
            {isExpanded && <span className="whitespace-nowrap">Add a task</span>}
          </button>
        </div>

        {/* Standard Navigation Items */}
        <div className="flex flex-col gap-1 px-1 overflow-hidden shrink-0">
          {/* Home / All Tasks */}
          <button
            id="nav-all-tasks"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-3.5 py-2 px-2.5 text-sm font-medium transition-all rounded-lg text-left cursor-pointer ${
              activeTab === 'all' 
                ? (darkMode ? 'bg-blue-500/15 text-[#8ab4f8]' : 'bg-blue-50 text-blue-600 font-semibold') 
                : (darkMode ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Home className="w-[18px] h-[18px] shrink-0 opacity-80" />
            {isExpanded && <span className="whitespace-nowrap">Home</span>}
          </button>

          {/* Starred */}
          <button
            id="nav-starred-tasks"
            onClick={() => setActiveTab('starred')}
            className={`flex items-center gap-3.5 py-2 px-2.5 text-sm font-medium transition-all rounded-lg text-left cursor-pointer ${
              activeTab === 'starred' 
                ? (darkMode ? 'bg-blue-500/15 text-[#8ab4f8]' : 'bg-blue-50 text-blue-600 font-semibold') 
                : (darkMode ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Star className="w-[18px] h-[18px] shrink-0 opacity-80" />
            {isExpanded && <span className="whitespace-nowrap">Starred</span>}
          </button>

          {/* Today's AI Plan */}
          <button
            id="nav-today-plan"
            onClick={() => setActiveTab('dayplan')}
            className={`flex items-center gap-3.5 py-2 px-2.5 text-sm font-medium transition-all rounded-lg text-left cursor-pointer ${
              activeTab === 'dayplan' 
                ? (darkMode ? 'bg-blue-500/15 text-[#8ab4f8]' : 'bg-blue-50 text-blue-600 font-semibold') 
                : (darkMode ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Calendar className="w-[18px] h-[18px] shrink-0 opacity-80" />
            {isExpanded && (
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="whitespace-nowrap truncate">Today's plan</span>
                <span className="text-[10px] bg-cyan-500/15 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 scale-90">AI</span>
              </div>
            )}
          </button>

          {/* Habit Tracker Analytics */}
          <button
            id="nav-habit-tracker"
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-3.5 py-2 px-2.5 text-sm font-medium transition-all rounded-lg text-left cursor-pointer ${
              activeTab === 'habits' 
                ? (darkMode ? 'bg-blue-500/15 text-[#8ab4f8]' : 'bg-blue-50 text-blue-600 font-semibold') 
                : (darkMode ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <BarChart2 className="w-[18px] h-[18px] shrink-0 opacity-80" />
            {isExpanded && <span className="whitespace-nowrap">Habit tracker</span>}
          </button>
        </div>

        {/* Divider */}
        <div className={`h-[1px] my-2 mx-1 shrink-0 ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`} />

        {/* LISTS Section */}
        {isExpanded && (
          <div className="flex flex-col px-2 overflow-hidden flex-1">
            <div 
              onClick={() => setListsExpanded(!listsExpanded)}
              className={`flex items-center justify-between py-1.5 px-1.5 text-[10px] font-bold tracking-widest uppercase mb-1 cursor-pointer rounded transition-all shrink-0 ${
                darkMode ? 'text-white/30 hover:bg-white/5' : 'text-slate-450 hover:bg-slate-100'
              }`}
            >
              <span>MY LISTS</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${listsExpanded ? '' : '-rotate-90'}`} />
            </div>

            {listsExpanded && (
              <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-0.5">
                {lists.map((list) => {
                  const isActive = activeList === list && activeTab === 'all';
                  return (
                    <button
                      key={list}
                      id={`list-btn-${list.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => {
                        setActiveTab('all');
                        setActiveList(list);
                      }}
                      className={`w-full flex items-center gap-3 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-all text-left truncate cursor-pointer shrink-0 ${
                        isActive
                          ? (darkMode ? 'bg-blue-500/15 text-[#8ab4f8]' : 'bg-blue-50 text-blue-600 font-semibold')
                          : (darkMode ? 'text-white/70 hover:bg-white/5' : 'text-slate-650 hover:bg-slate-100')
                      }`}
                    >
                      <Folder className="w-4 h-4 opacity-60 shrink-0" />
                      <span className="truncate whitespace-nowrap">{list}</span>
                    </button>
                  );
                })}

                {/* Create new list input */}
                {showAddList ? (
                  <form onSubmit={handleAddListSubmit} className="mt-2 px-1">
                    <input
                      id="new-list-input"
                      type="text"
                      required
                      placeholder="New list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-transparent outline-none ${
                        darkMode ? 'border-white/12 text-[#e6edf3] placeholder-white/30' : 'border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      autoFocus
                    />
                  </form>
                ) : (
                  <button
                    id="add-new-list-toggle"
                    onClick={() => setShowAddList(true)}
                    className="flex items-center gap-2.5 py-1.5 px-2.5 text-xs text-[#00bcd4] hover:text-[#00bcd4]/80 transition-all font-medium text-left cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create new list</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section (User Profile Card featuring Jitesh Pulse badge) */}
      <div className="p-2 shrink-0">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              key="user-expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col gap-2 p-2.5 rounded-xl border backdrop-blur-md shadow-sm transition-all ${
                darkMode 
                  ? 'bg-white/3 border-white/5' 
                  : 'bg-white border-slate-250 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 rounded-full bg-[#00bcd4] text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(0,188,212,0.3)]">
                  JI
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold leading-tight ${darkMode ? 'text-[#e6edf3]' : 'text-slate-800'}`}>
                    Jitesh
                  </span>
                  <span className="text-[9px] text-[#f59e0b] font-bold tracking-wider uppercase">
                    ⚡ CHIEF OF STAFF
                  </span>
                </div>
              </div>

              {/* Explicit badge for "Jitesh - Pulse: 78" as requested */}
              <div className="flex">
                <span className="inline-flex items-center gap-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-2.5 py-1 rounded-full shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                  Jitesh - Pulse: {pulseScore.score}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="user-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center p-1"
            >
              <div className="w-8.5 h-8.5 rounded-full bg-[#00bcd4] text-black flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(0,188,212,0.3)] cursor-pointer">
                JI
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
