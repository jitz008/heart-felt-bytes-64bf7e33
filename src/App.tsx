import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskPanel from './components/TaskPanel';
import AIPanel from './components/AIPanel';
import DayPlanView from './components/DayPlanView';
import HabitDashboard from './components/HabitDashboard';
import HomeView from './components/HomeView';
import Login from './components/Login';
import { useTasks } from './hooks/useTasks';
import { useAI } from './hooks/useAI';
import { Search, Sparkles, X, CheckSquare, LogOut } from 'lucide-react';

export default function App() {
  // Pulse Tasks 2.0 is a dark-only blue/black world per spec.
  const darkMode = true;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);

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
    addTaskFromAI,
    toggleRoadmapStep,
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

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (authChecking) {
    return <FullScreenLoader label="Securing Authentication Tunnel..." />;
  }

  if (!user && !isGuest) {
    return (
      <Login
        signInWithGoogle={signInWithGoogle}
        signInWithEmail={signInWithEmail}
        signUpWithEmail={signUpWithEmail}
        continueAsGuest={continueAsGuest}
        darkMode={true}
      />
    );
  }

  if (loading) {
    return <FullScreenLoader label="Preloading Pulse Tasks Engine..." />;
  }

  const initials = (user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'JI').toUpperCase();

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden font-sans text-white/90 select-none relative">
      {/* Breathing blue-black background */}
      <div className="pulse-bg">
        <div className="pulse-orb pulse-orb-1" />
        <div className="pulse-orb pulse-orb-2" />
        <div className="pulse-orb pulse-orb-3" />
      </div>

      {/* ──────────── TOPBAR ──────────── */}
      <header
        className="h-[52px] shrink-0 sticky top-0 z-50 flex items-center justify-between px-4 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: 'rgba(6,13,26,0.85)' }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #7c6beb 100%)' }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="text-[16px] font-medium text-white/95 leading-none">Pulse Tasks</span>
          <span className="text-[11px] text-white/35 font-normal">2.0</span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="glass-input flex items-center gap-2.5 px-4 h-9 w-full max-w-[480px]" style={{ borderRadius: 22 }}>
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-[13px] text-white/90 placeholder:text-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Gemini badge + Pulse AI toggle + avatar */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-[12px] text-[11px]"
            style={{
              background: 'rgba(79,142,247,0.08)',
              border: '1px solid rgba(79,142,247,0.18)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] gemini-dot" />
            <span>{isLiveAI ? 'Live Gemini active' : 'Gemini standby'}</span>
          </div>

          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`btn-translucent w-8 h-8 flex items-center justify-center ${rightSidebarOpen ? 'active' : ''}`}
            title="Pulse AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[11px] font-medium shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
            title={user?.email || 'Guest'}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initials
            )}
          </div>

          <button
            onClick={logout}
            className="btn-translucent w-8 h-8 flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ──────────── BODY ──────────── */}
      <div className="flex-1 flex overflow-hidden relative z-[1]">
        <Sidebar
          lists={lists}
          activeList={activeList}
          setActiveList={setActiveList}
          createList={createList}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pulseScore={pulseScore}
          darkMode={darkMode}
          setDarkMode={() => {}}
          isLiveAI={isLiveAI}
        />

        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {activeTab === 'dayplan' ? (
            <DayPlanView tasks={tasks} dayPlan={dayPlan} toggleComplete={toggleComplete} darkMode={darkMode} />
          ) : activeTab === 'habits' ? (
            <HabitDashboard tasks={tasks} pulseScore={pulseScore} darkMode={darkMode} userId={user?.uid || null} isFirebase={!!user} />
          ) : activeTab === 'all' ? (
            <HomeView
              tasks={tasks}
              addTaskNatural={addTaskNatural}
              addTaskFromAI={addTaskFromAI}
              toggleComplete={toggleComplete}
              toggleRoadmapStep={toggleRoadmapStep}
              aiLoading={aiLoading}
              aiStatusMessage={aiStatusMessage}
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

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center text-white/80 relative" style={{ background: '#060d1a' }}>
      <div className="pulse-bg">
        <div className="pulse-orb pulse-orb-1" />
        <div className="pulse-orb pulse-orb-2" />
        <div className="pulse-orb pulse-orb-3" />
      </div>
      <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
        style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}>
        <CheckSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
      <span className="relative z-10 text-[11px] font-mono text-[#4f8ef7] mt-6 tracking-widest uppercase animate-pulse">
        {label}
      </span>
    </div>
  );
}
