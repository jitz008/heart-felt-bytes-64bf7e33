export interface ChecklistItem {
  id: string;
  step: string;
  minutes: number;
  is_done: boolean;
}

export interface RoadmapStep {
  step: string;
  timing: string;
  done?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  category: 'work' | 'study' | 'personal' | 'finance' | 'health';
  cadence: 'daily' | 'weekly';
  target_per_week: number; // 1-7
  match_keywords: string[]; // used to count related task completions
  reason: string;           // why Gemini suggested it
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  deadline_iso?: string;
  deadline_human?: string;
  estimated_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  urgency: 'critical' | 'high' | 'later';
  category: 'work' | 'study' | 'personal' | 'finance' | 'health';
  priority_score: number; // 1-10
  calendar_conflict: string | null;
  reasoning: string;
  status: 'active' | 'done' | 'missed';
  created_at: string;
  completed_at?: string;
  checklist: ChecklistItem[];
  starred?: boolean;
  list: string;
  calendarEventId?: string;
  googleTaskId?: string;
  googleTaskListId?: string;
  // ───── Tasks 2.0 AI intake additions ─────
  taskType?: 'meeting' | 'event' | 'payment' | 'errand' | 'social' | 'interview' | 'health' | 'family' | 'other' | string;
  complexity?: 'simple' | 'medium' | 'complex';
  person?: string;
  location?: string;
  topic?: string;
  amount?: string;
  roadmapSteps?: RoadmapStep[];
  priorityReason?: string;
  priorityScore?: number; // 0-150 rubric score
  productivityRecommendation?: {
    summary: string;
    tips: string[];
    aiInsight: string;
  } | null;
  conflict_status?: 'none' | 'pending' | 'resolved';
  // Allow AI's three-tier priority alongside legacy urgency
  priority?: 'high' | 'medium' | 'low';
}

export interface ClarifyingQuestion {
  question: string;
  chips: string[];
  key?: string;
}

export interface IntakeResult {
  title: string;
  taskType: Task['taskType'];
  complexity: Task['complexity'];
  extractedEntities: { time?: string; person?: string; location?: string };
  missingCritical: string[];
  clarifyingQuestions: ClarifyingQuestion[];
  priority: 'high' | 'medium' | 'low';
  priorityReason: string;
  roadmapSteps: RoadmapStep[];
  userPace: 'hurried' | 'casual';
}

export interface DayPlanBlock {
  time: string;
  end_time?: string;
  title: string;
  type: 'task' | 'calendar' | 'break';
  priority?: 'critical' | 'high' | 'later' | null;
  task_id?: string | null;
  note?: string;
}

export interface PulseAlert {
  severity: 'critical' | 'high';
  message: string;
}

export interface ProductivityRec {
  recommendation: string;
  insight_type: 'timing' | 'category' | 'streak' | 'risk';
}

export interface PulseScore {
  score: number;
  verdict: string;
  trend: 'improving' | 'declining' | 'stable';
  streak: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string or time string
  end: string;
  color?: string;
}
