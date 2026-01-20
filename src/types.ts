export type TaskType = 'backlog' | 'high' | 'medium' | 'low' | 'leisure' | 'chores';
export type GridRow = 'GOAL' | 'FOCUS' | 'WORK' | 'LEISURE' | 'CHORES';

export type TaskStatus = 'unscheduled' | 'scheduled' | 'completed' | 'rescheduled';

export interface Task {
  id: string;
  title: string;
  description?: string; // Optional multi-line details
  duration: number; // minutes
  type: TaskType;
  status: TaskStatus;
  dueDate: string | null; // ISO Date string YYYY-MM-DD (when scheduled on board)
  deadline: string | null; // ISO Date string YYYY-MM-DD (must be done by this date)
  scheduledTime?: string; // HH:MM format for timeline view (e.g., "09:00")
  assignedRow: GridRow | null;
  eisenhowerQuad: 'do' | 'decide' | 'delegate' | 'delete' | null;
  createdAt: number;
  isFrozen?: boolean;
  sortOrder?: number;
  completedAt?: number; // millisecond timestamp
}

export interface Habit {
  id: string;
  name: string;
  goal: number; // Days per week (1-7)
  checks: boolean[]; // Index 0 = Mon, 6 = Sun
}

export interface Note {
  id: string;
  content: string;
}

export interface BrainDumpList {
  id: string;
  title: string;
  content: string;
  lastEdited?: number; // Timestamp of last edit
  notes?: Note[]; // Deprecated, kept for migration
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  brainDumpLists: BrainDumpList[];
  brainDumpContent?: string; // Legacy
  notes?: Note[]; // Legacy
  dayHistory?: Record<string, any>;
  statsResetAt?: number; // millisecond timestamp
}
