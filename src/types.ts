export type TaskType = 'backlog' | 'high' | 'medium' | 'low' | 'leisure' | 'chores';
export type GridRow = 'GOAL' | 'FOCUS' | 'WORK' | 'LEISURE' | 'CHORES';

export type TaskStatus = 'unscheduled' | 'scheduled' | 'completed';

export interface Task {
  id: string;
  title: string;
  duration: number; // minutes
  type: TaskType;
  status: TaskStatus;
  dueDate: string | null; // ISO Date string YYYY-MM-DD
  assignedRow: GridRow | null;
  eisenhowerQuad: 'do' | 'decide' | 'delegate' | 'delete' | null;
  createdAt: number;
}

export interface Habit {
  id: string;
  name: string;
  goal: number; // Days per week (1-7)
  checks: boolean[]; // Index 0 = Mon, 6 = Sun
}

export interface BrainDumpList {
  id: string;
  title: string;
  content: string;
}

export interface Note {
  date: string; // YYYY-MM-DD
  content: string;
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  brainDumpLists?: BrainDumpList[];
  brainDumpContent?: string; // Deprecated, kept for migration
  notes?: Note[]; // Deprecated, kept for migration
}