import { useState, useEffect } from 'react';
import { Task, DayPlanBlock, PulseAlert, ProductivityRec, PulseScore, CalendarEvent } from '../types';

export function useAI(tasks: Task[], accessToken: string | null) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [alerts, setAlerts] = useState<PulseAlert[]>([]);
  const [recommendation, setRecommendation] = useState<ProductivityRec | null>(null);
  const [dayPlan, setDayPlan] = useState<DayPlanBlock[]>([]);
  const [pulseScore, setPulseScore] = useState<PulseScore>({
    score: 75,
    verdict: "Ready to launch! Complete tomorrow's critical report early to lock in your momentum.",
    trend: 'stable',
    streak: 3
  });
  const [aiStatusMessage, setAiStatusMessage] = useState<string>("");
  const [isLiveAI, setIsLiveAI] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Check backend AI status
  useEffect(() => {
    fetch("/api/ai-status")
      .then(res => res.json())
      .then(data => {
        setIsLiveAI(data.live);
        setAiStatusMessage(data.message);
      })
      .catch(() => {
        setIsLiveAI(false);
        setAiStatusMessage("Running in sandbox simulation mode.");
      });
  }, []);

  // Fetch Calendar events
  const fetchCalendar = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch("/api/calendar", { headers });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch /api/gemini/nudge
  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/gemini/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status === 'active'),
          calendar: calendarEvents,
          datetime: new Date().toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch /api/gemini/recommend
  const fetchRecommendation = async () => {
    try {
      const res = await fetch("/api/gemini/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: tasks.filter(t => t.status === 'done'),
          pending: tasks.filter(t => t.status === 'active'),
          datetime: new Date().toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch /api/gemini/dayplan
  const generateDayPlan = async () => {
    try {
      const res = await fetch("/api/gemini/dayplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status === 'active'),
          calendar: calendarEvents,
          date: new Date().toLocaleDateString(),
          productive_hours: "9-11 AM"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDayPlan(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch /api/gemini/score
  const fetchPulseScore = async () => {
    try {
      const res = await fetch("/api/gemini/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: tasks.filter(t => t.status === 'done'),
          pending: tasks.filter(t => t.status === 'active'),
          missed: tasks.filter(t => t.status === 'missed')
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPulseScore(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync everything when tasks change or accessToken changes
  useEffect(() => {
    setIsRefreshing(true);
    const sync = async () => {
      await fetchCalendar();
      await fetchAlerts();
      await fetchRecommendation();
      await generateDayPlan();
      await fetchPulseScore();
      setIsRefreshing(false);
    };
    sync();
  }, [tasks, accessToken]);

  // Voice interpreter connector
  const processVoiceCommand = async (transcript: string) => {
    try {
      const res = await fetch("/api/gemini/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          datetime: new Date().toISOString(),
          tasks,
          calendar: calendarEvents
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  return {
    calendarEvents,
    alerts,
    recommendation,
    dayPlan,
    pulseScore,
    isLiveAI,
    aiStatusMessage,
    isRefreshing,
    processVoiceCommand,
    refreshAll: async () => {
      setIsRefreshing(true);
      await fetchCalendar();
      await fetchAlerts();
      await fetchRecommendation();
      await generateDayPlan();
      await fetchPulseScore();
      setIsRefreshing(false);
    }
  };
}
