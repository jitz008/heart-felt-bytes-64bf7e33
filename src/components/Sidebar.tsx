import React, { useState } from 'react';
import {
  Plus, Folder, Star, Calendar, BarChart2, ChevronDown,
  Home, History, Sparkles
} from 'lucide-react';
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
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listsExpanded, setListsExpanded] = useState(true);

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName('');
      setShowAddList(false);
    }
  };

  const navItems: Array<{
    id: typeof activeTab | 'previous';
    icon: React.ReactNode;
    label: string;
    badge?: string;
    onClick: () => void;
    isActive: boolean;
  }> = [
    { id: 'all',     icon: <Home className="w-[18px] h-[18px]" />,      label: 'Home',          onClick: () => setActiveTab('all'),     isActive: activeTab === 'all' },
    { id: 'starred', icon: <Star className="w-[18px] h-[18px]" />,      label: 'Starred',       onClick: () => setActiveTab('starred'), isActive: activeTab === 'starred' },
    { id: 'today',   icon: <Folder className="w-[18px] h-[18px]" />,    label: 'All lists',     onClick: () => setActiveTab('today'),   isActive: activeTab === 'today' },
    { id: 'dayplan', icon: <Calendar className="w-[18px] h-[18px]" />,  label: "Today's plan",  badge: 'AI', onClick: () => setActiveTab('dayplan'), isActive: activeTab === 'dayplan' },
    { id: 'habits',  icon: <BarChart2 className="w-[18px] h-[18px]" />, label: 'Habit tracker', onClick: () => setActiveTab('habits'),  isActive: activeTab === 'habits' },
  ];

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="h-full flex flex-col justify-between shrink-0 border-r border-white/[0.06] overflow-hidden"
      style={{
        background: 'rgba(6,13,26,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        width: expanded ? 240 : 52,
        transition: 'width 250ms ease',
      }}
    >
      {/* Top stack */}
      <div className="flex flex-col py-3 gap-1 overflow-hidden">

        {/* Main nav */}
        <div className="flex flex-col gap-0.5 px-2">
          {navItems.map((n) => (
            <NavButton
              key={n.id as string}
              icon={n.icon}
              label={n.label}
              badge={n.badge}
              expanded={expanded}
              active={n.isActive}
              onClick={n.onClick}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-px my-2 mx-3 bg-white/[0.07]" />

        {/* History (previous tasks scroll cue) */}
        <div className="flex flex-col gap-0.5 px-2">
          <NavButton
            icon={<History className="w-[18px] h-[18px]" />}
            label="Previous tasks"
            expanded={expanded}
            active={false}
            onClick={() => {
              setActiveTab('all');
              setTimeout(() => {
                const el = document.querySelector('h2');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          />
        </div>

        {/* MY LISTS (expanded only) */}
        {expanded && (
          <div className="flex flex-col px-2 mt-3 overflow-hidden">
            <button
              onClick={() => setListsExpanded(!listsExpanded)}
              className="flex items-center justify-between py-1.5 px-2 text-[10px] font-bold tracking-[0.1em] uppercase text-white/30 hover:text-white/55 transition-colors rounded"
            >
              <span>MY LISTS</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${listsExpanded ? '' : '-rotate-90'}`} />
            </button>

            {listsExpanded && (
              <div className="flex flex-col gap-0.5 overflow-y-auto pr-0.5 mt-1">
                {lists.map((list) => {
                  const isActive = activeList === list && activeTab === 'all';
                  return (
                    <button
                      key={list}
                      onClick={() => { setActiveTab('all'); setActiveList(list); }}
                      className={`flex items-center gap-3 py-1.5 px-2.5 rounded-[10px] text-[13px] transition-all text-left truncate ${
                        isActive ? 'bg-[rgba(79,142,247,0.15)] text-[#4f8ef7]' : 'text-white/65 hover:bg-white/[0.06] hover:text-white/90'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span className="truncate">{list}</span>
                    </button>
                  );
                })}

                {showAddList ? (
                  <form onSubmit={handleAddListSubmit} className="mt-1 px-1">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="New list name…"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onBlur={() => { if (!newListName.trim()) setShowAddList(false); }}
                      className="glass-input w-full text-[12px] px-2.5 py-1.5"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddList(true)}
                    className="flex items-center gap-2 py-1.5 px-2.5 text-[13px] text-[#4f8ef7] hover:text-[#7aa9f8] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create new list</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom user card */}
      <div className="p-2 shrink-0">
        {expanded ? (
          <div
            className="flex flex-col gap-2 p-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-[11px] shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
              >
                JI
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] text-white/90 font-medium leading-tight">Jitesh</span>
                <span className="text-[9px] text-[#f59e0b] font-bold tracking-wider uppercase">⚡ Chief of Staff</span>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 self-start text-[10px] font-medium px-2.5 py-1 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Pulse: {pulseScore.score}
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-[11px]"
              style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)' }}
            >
              JI
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavButton({
  icon, label, badge, expanded, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  expanded: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-translucent flex items-center gap-3 h-9 ${expanded ? 'px-2.5 justify-start' : 'justify-center'} ${active ? 'active' : ''}`}
      title={label}
    >
      <span className="shrink-0 flex items-center justify-center w-5">{icon}</span>
      {expanded && (
        <span className="flex items-center gap-2 whitespace-nowrap text-[13px]">
          {label}
          {badge && (
            <span
              className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
            >
              {badge}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
