import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Habit, Task } from '../types';

const LOCAL_KEY = 'pulse_habits_v1';

const loadLocal = (): Habit[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};
const saveLocal = (h: Habit[]) => localStorage.setItem(LOCAL_KEY, JSON.stringify(h));

export function useHabits(userId: string | null, isFirebase: boolean) {
  const [habits, setHabits] = useState<Habit[]>(() => loadLocal());
  const [suggestions, setSuggestions] = useState<Habit[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Subscribe to Firestore habits
  useEffect(() => {
    if (!isFirebase || !userId) {
      setHabits(loadLocal());
      return;
    }
    const col = collection(db, 'users', userId, 'habits');
    const unsub = onSnapshot(
      col,
      (snap) => setHabits(snap.docs.map((d) => d.data() as Habit)),
      (err) => console.error('habits snapshot error:', err),
    );
    return () => unsub();
  }, [userId, isFirebase]);

  const acceptHabit = async (habit: Habit) => {
    const next: Habit = { ...habit, created_at: new Date().toISOString() };
    if (isFirebase && userId) {
      await setDoc(doc(db, 'users', userId, 'habits', habit.id), next);
    } else {
      const updated = [next, ...habits.filter((h) => h.id !== habit.id)];
      setHabits(updated);
      saveLocal(updated);
    }
    setSuggestions((s) => s.filter((x) => x.id !== habit.id));
  };

  const dismissSuggestion = (id: string) =>
    setSuggestions((s) => s.filter((x) => x.id !== id));

  const removeHabit = async (id: string) => {
    if (isFirebase && userId) {
      await deleteDoc(doc(db, 'users', userId, 'habits', id));
    } else {
      const updated = habits.filter((h) => h.id !== id);
      setHabits(updated);
      saveLocal(updated);
    }
  };

  const refreshSuggestions = async (tasks: Task[]) => {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const summary = tasks.slice(0, 60).map((t) => ({
        title: t.title,
        category: t.category,
        status: t.status,
        completed_at: t.completed_at || null,
      }));
      const res = await fetch('/api/gemini/suggest-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: summary, existing: habits.map((h) => h.name) }),
      });
      const data = await res.json();
      const items: Habit[] = (Array.isArray(data) ? data : data.habits || []).map(
        (s: any, i: number) => ({
          id: `sug-${Date.now()}-${i}`,
          name: String(s.name || 'Habit'),
          emoji: s.emoji || '✦',
          category: s.category || 'personal',
          cadence: s.cadence === 'weekly' ? 'weekly' : 'daily',
          target_per_week: Math.max(1, Math.min(7, Number(s.target_per_week) || 5)),
          match_keywords: Array.isArray(s.match_keywords) ? s.match_keywords : [],
          reason: String(s.reason || ''),
          created_at: '',
        }),
      );
      setSuggestions(items);
    } catch (e: any) {
      setSuggestError(e?.message || 'Could not load suggestions');
    } finally {
      setSuggestLoading(false);
    }
  };

  return {
    habits,
    suggestions,
    suggestLoading,
    suggestError,
    refreshSuggestions,
    acceptHabit,
    dismissSuggestion,
    removeHabit,
  };
}

// Compute how many tasks matching a habit's keywords/category were completed in last N days
export function habitStreak(habit: Habit, tasks: Task[], days = 7): { done: number; pct: number } {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const kws = habit.match_keywords.map((k) => k.toLowerCase());
  const done = tasks.filter((t) => {
    if (t.status !== 'done' || !t.completed_at) return false;
    if (new Date(t.completed_at).getTime() < cutoff) return false;
    if (t.category === habit.category) return true;
    const text = t.title.toLowerCase();
    return kws.some((k) => k && text.includes(k));
  }).length;
  const target = habit.cadence === 'daily' ? days : Math.ceil((habit.target_per_week * days) / 7);
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return { done, pct };
}
