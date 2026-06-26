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
  taskType?: 'meeting' | 'event' | 'payment' | 'errand' | 'social' | 'other';
  complexity?: 'simple' | 'medium' | 'complex';
  person?: string;
  location?: string;
  roadmapSteps?: RoadmapStep[];
  priorityReason?: string;
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
