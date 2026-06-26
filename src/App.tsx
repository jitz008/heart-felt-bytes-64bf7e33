import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskPanel from './components/TaskPanel';
import AIPanel from './components/AIPanel';
import DayPlanView from './components/DayPlanView';
import HabitDashboard from './components/HabitDashboard';
import Login from './components/Login';
import { useTasks } from './hooks/useTasks';
import { useAI } from './hooks/useAI';
import { 
  Menu, Search, HelpCircle, Grid, Sparkles, X, Star,
  Moon, Sun, Calendar, CheckSquare, Settings, LogOut, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);

  const {
    tasks,
    loading,
    aiLoading,
    aiStep,
    aiStepsHistory,
    lists,
    activeList,
    setActiveList,
    createList,
    activeTab,
    setActiveTab,
    toggleStar,
    toggleComplete,
    toggleChecklistItem,
    deleteTask,
    addTaskNatural,
    addManualTask,
    breakTaskDown,
    rescueTask,
    user,
    authChecking,
    isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    continueAsGuest,
    accessToken,
    isSyncingGoogleTasks,
    syncGoogleTasks,
    googleTasksError,
    googleCalendarError
  } = useTasks();

  const {
    calendarEvents,
    alerts,
    recommendation,
    dayPlan,
    pulseScore,
    isLiveAI,
    aiStatusMessage,
    isRefreshing,
    processVoiceCommand,
    refreshAll
  } = useAI(tasks, accessToken);

  // Set initial theme based on preferences or default dark
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  if (authChecking) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#09090B] text-slate-100">
        <div className="w-10 h-10 rounded-xl bg-[#1a73e8] flex items-center justify-center shadow-[0_0_20px_rgba(26,115,232,0.35)] animate-pulse">
          <CheckSquare className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <span className="text-xs font-mono text-blue-400 mt-6 tracking-widest uppercase animate-pulse">Securing Authentication Tunnel...</span>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <Login
        signInWithGoogle={signInWithGoogle}
        signInWithEmail={signInWithEmail}
        signUpWithEmail={signUpWithEmail}
        continueAsGuest={continueAsGuest}
        darkMode={darkMode}
      />
    );
  }

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#09090B] text-slate-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-pulse">
          <CheckSquare className="w-6 h-6 text-black stroke-[2.5]" />
        </div>
        <span className="text-xs font-mono text-emerald-400 mt-6 tracking-widest uppercase animate-pulse">Preloading Pulse Tasks Engine...</span>
      </div>
    );
  }

  return (
    <div 
      id="app-main-layout"
      className="w-screen h-screen flex flex-col overflow-hidden font-sans transition-colors duration-250 select-none"
      style={{
        backgroundColor: darkMode ? '#1e1e1f' : '#f8fafc',
        color: darkMode ? '#e3e3e3' : '#1e293b',
      }}
    >
      {/* 1. PULSE TASKS 2.0 STICKY TOP BAR */}
      <header 
        className={`h-14 shrink-0 border-b sticky top-0 z-50 flex items-center justify-between px-4 transition-colors duration-250 backdrop-blur-[20px] ${
          darkMode 
            ? 'border-white/5 bg-[#0d1117]/80 text-[#e6edf3]' 
            : 'border-slate-200 bg-white/95 text-slate-800 shadow-xs'
        }`}
      >
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              darkMode 
                ? 'bg-white/4 border border-white/8 text-white/50 hover:text-white hover:bg-white/10' 
                : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>
          
          {/* App Logo shown when sidebar is collapsed */}
          {!leftSidebarOpen && (
            <div className="flex items-center gap-2 select-none animate-fadeIn">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #4285F4 0%, #7C4DFF 100%)'
                }}
              >
                <svg className="w-4 h-4 text-white stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className={`text-base font-bold tracking-tight ${darkMode ? 'text-[#e6edf3]' : 'text-slate-900'}`}>
                Pulse Tasks
              </span>
              <span className="text-[9px] bg-blue-500/15 text-blue-500 dark:text-[#8ab4f8] border border-blue-500/20 rounded-[10px] px-1.5 py-0.5 font-medium">
                2.0
              </span>
            </div>
          )}
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-[400px] mx-4">
          <div 
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all focus-within:border-blue-500/50 focus-within:shadow-[0_0_10px_rgba(26,115,232,0.1)] ${
              darkMode 
                ? 'bg-white/4 border-white/8' 
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Search className="w-4 h-4 text-slate-450 shrink-0" />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent border-0 outline-none text-xs font-sans ${
                darkMode ? 'text-[#e6edf3] placeholder-white/30' : 'text-slate-800 placeholder-slate-400 font-medium'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded-full hover:bg-slate-200/50 cursor-pointer text-slate-450 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & Theme toggle & Sidebar toggle */}
        <div className="flex items-center gap-3">
          {/* Star shortcut button */}
          <button 
            onClick={() => setActiveTab('starred')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-white/4 border-white/8 text-white/50 hover:text-[#8ab4f8] hover:bg-white/10' 
                : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-200'
            }`}
            title="Starred Tasks"
          >
            <Star className="w-4 h-4" />
          </button>

          {/* Custom Aesthetic Theme Toggle resembling watermarked_img_1131943547097114823.png */}
          <div 
            className={`flex items-center p-0.5 rounded-full border transition-colors ${
              darkMode 
                ? 'bg-white/4 border-white/8' 
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setDarkMode(false)}
              className={`p-1 rounded-full transition-all cursor-pointer ${
                !darkMode ? 'bg-white text-amber-500 shadow-xs' : 'text-white/45 hover:text-white'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`p-1 rounded-full transition-all cursor-pointer ${
                darkMode ? 'bg-white/10 text-indigo-400 shadow-xs' : 'text-slate-450 hover:text-slate-800'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pulse AI Right Sidebar Toggle Button */}
          <button 
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              rightSidebarOpen 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs' 
                : (darkMode ? 'bg-white/4 border-white/8 text-white/50 hover:text-white hover:bg-white/10' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200')
            }`}
            title="Toggle Pulse AI Sidebar"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
          </button>

          {/* Live Gemini active dot */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#3fb950] font-mono tracking-wide px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] gemini-dot animate-pulse" />
            <span className={darkMode ? 'text-emerald-400/80' : 'text-emerald-600/80 font-bold'}>Active</span>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div 
                  className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden"
                  title={user.email || 'User'}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (user.displayName?.substring(0, 2) || user.email?.substring(0, 2) || 'JI').toUpperCase()
                  )}
                </div>
                <button
                  onClick={logout}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-white/4 border-white/8 text-white/50 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20' 
                      : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div 
                  className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-xs shadow-sm"
                  title="Guest Mode"
                >
                  GST
                </div>
                <button
                  onClick={logout}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-white/4 border-white/8 text-white/50 hover:text-blue-400 hover:bg-blue-500/10' 
                      : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Sign In"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. THREE-PANEL CORE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <AnimatePresence initial={false}>
          {leftSidebarOpen && (
            <Sidebar
              lists={lists}
              activeList={activeList}
              setActiveList={setActiveList}
              createList={createList}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              pulseScore={pulseScore}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              isLiveAI={isLiveAI}
            />
          )}
        </AnimatePresence>

        {/* CENTER WORKSPACE */}
        <div id="center-workspace-wrapper" className="flex-1 h-full overflow-hidden flex flex-col">
          {activeTab === 'dayplan' ? (
            <DayPlanView
              tasks={tasks}
              dayPlan={dayPlan}
              toggleComplete={toggleComplete}
              darkMode={darkMode}
            />
          ) : activeTab === 'habits' ? (
            <HabitDashboard
              tasks={tasks}
              pulseScore={pulseScore}
              darkMode={darkMode}
            />
          ) : (
            <TaskPanel
              tasks={tasks}
              activeList={activeList}
              activeTab={activeTab}
              aiLoading={aiLoading}
              aiStep={aiStep}
              aiStepsHistory={aiStepsHistory}
              toggleStar={toggleStar}
              toggleComplete={toggleComplete}
              toggleChecklistItem={toggleChecklistItem}
              deleteTask={deleteTask}
              addTaskNatural={addTaskNatural}
              breakTaskDown={breakTaskDown}
              rescueTask={rescueTask}
              darkMode={darkMode}
              isLiveAI={isLiveAI}
              aiStatusMessage={aiStatusMessage}
              searchQuery={searchQuery}
              syncGoogleTasks={syncGoogleTasks}
              isSyncingGoogleTasks={isSyncingGoogleTasks}
              accessToken={accessToken}
              signInWithGoogle={signInWithGoogle}
              googleTasksError={googleTasksError}
              googleCalendarError={googleCalendarError}
            />
          )}
        </div>

        {/* RIGHT PULSE AI WORKSPACE */}
        <AIPanel
          isOpen={rightSidebarOpen}
          setIsOpen={setRightSidebarOpen}
          tasks={tasks}
          calendarEvents={calendarEvents}
          alerts={alerts}
          recommendation={recommendation}
          pulseScore={pulseScore}
          processVoiceCommand={processVoiceCommand}
          addTaskNatural={addTaskNatural}
          toggleComplete={toggleComplete}
          refreshAll={refreshAll}
          isRefreshing={isRefreshing}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
