import { useMemo, useCallback } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Task, GridRow } from '../types';
import { getWeekDays, formatDate, TARGET_HOURS_PER_DAY, getAdjustedDate } from '../constants';

// ============================================================================
// Types
// ============================================================================

export interface DailyStats {
  dateStr: string;
  totalMinutes: number;
  plannedPercent: number;
  completionPercent: number;
  completionColor: string;
  plannedHours: string;
  isOverCapacity: boolean;
  isNearCapacity: boolean;
}

export interface PlannerActions {
  /** Handle drop on grid cell (schedules task to day/row) */
  onDropOnGrid: (e: React.DragEvent, day: Date, row: GridRow | null) => void;
  /** Handle drag start (sets taskId in dataTransfer) */
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  /** Handle drag end (cleanup) */
  onDragEnd: (e: React.DragEvent) => void;
  /** Toggle task completion status */
  onToggleTaskComplete: (taskId: string) => void;
  /** Update task properties */
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  /** Delete a task */
  onDeleteTask: (taskId: string) => void;
  /** Reorder tasks (drag within list) */
  onReorderTasks: (sourceId: string, targetId: string) => void;
  /** Move overdue/active tasks into the icebox */
  onFreezeOverloaded: () => void;
}

export interface PlannerData {
  /** All tasks from context */
  tasks: Task[];
  /** Array of 7 Date objects for current week (Mon-Sun) */
  currentWeekDays: Date[];
  /** Today's date string (YYYY-MM-DD), adjusted for late-night usage */
  todayStr: string;
  /** Unique key for the current week (used for animations) */
  weekKey: string;
  /** Pre-computed stats for each day of the week */
  dailyStats: DailyStats[];
  /** Whether any drag operation is in progress */
  isDragging: boolean;
}

export interface PlannerController extends PlannerData {
  actions: PlannerActions;
}

export interface UsePlannerControllerOptions {
  /** Current date to base the week view on */
  currentDate: Date;
}

// ============================================================================
// Utility Functions (Pure, testable)
// ============================================================================

/**
 * Compute gradient color from red (0%) through yellow (50%) to green (100%)
 * Used for completion progress visualization
 */
export function getProgressColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));

  if (p <= 50) {
    // Red to Yellow: (239, 68, 68) to (250, 204, 21)
    const r = Math.round(239 + (250 - 239) * (p / 50));
    const g = Math.round(68 + (204 - 68) * (p / 50));
    const b = Math.round(68 + (21 - 68) * (p / 50));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green: (250, 204, 21) to (34, 197, 94)
    const r = Math.round(250 + (34 - 250) * ((p - 50) / 50));
    const g = Math.round(204 + (197 - 204) * ((p - 50) / 50));
    const b = Math.round(21 + (94 - 21) * ((p - 50) / 50));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Compute daily statistics for a given day
 * Pure function - can be unit tested independently
 */
export function computeDayStats(
  tasks: Task[],
  dateStr: string,
  targetMinutes: number
): DailyStats {
  const dayTasks = tasks.filter(
    t => t.dueDate === dateStr && t.status !== 'unscheduled'
  );
  const completedTasks = dayTasks.filter(t => t.status === 'completed');
  
  const totalMinutes = dayTasks.reduce((acc, t) => acc + t.duration, 0);
  const completedMinutes = completedTasks.reduce((acc, t) => acc + t.duration, 0);
  
  const plannedPercent = Math.min(100, (totalMinutes / targetMinutes) * 100);
  const completionPercent = totalMinutes > 0 
    ? Math.round((completedMinutes / totalMinutes) * 100) 
    : 0;

  return {
    dateStr,
    totalMinutes,
    plannedPercent,
    completionPercent,
    completionColor: getProgressColor(completionPercent),
    plannedHours: (totalMinutes / 60).toFixed(1).replace(/\.0$/, ''),
    isOverCapacity: plannedPercent > 100,
    isNearCapacity: plannedPercent > 80
  };
}

/**
 * Compute stats for all days in a week
 * Pure function - can be unit tested independently
 */
export function computeWeekStats(
  tasks: Task[],
  weekDays: Date[],
  targetHoursPerDay: number
): DailyStats[] {
  const targetMinutes = targetHoursPerDay * 60;
  const safeTasks = tasks || [];
  
  return weekDays.map(day => {
    const dateStr = formatDate(day);
    return computeDayStats(safeTasks, dateStr, targetMinutes);
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * usePlannerController - The "brain" of the planner view
 * 
 * Encapsulates all state management, derived data computation, and actions
 * for the weekly planner. Designed to be reused across different view 
 * implementations (WeekView, MobileDayView, etc.)
 * 
 * @param options.currentDate - The date to base the week view on
 * @returns PlannerController with data and actions
 * 
 * @example
 * // In WeekView.tsx
 * const { tasks, currentWeekDays, dailyStats, actions } = usePlannerController({
 *   currentDate: selectedDate
 * });
 * 
 * @example
 * // In future MobileDayView.tsx
 * const { tasks, currentWeekDays, actions } = usePlannerController({
 *   currentDate: selectedDate
 * });
 * const todayTasks = tasks.filter(t => t.dueDate === formatDate(selectedDate));
 */
export function usePlannerController(
  options: UsePlannerControllerOptions
): PlannerController {
  const { currentDate } = options;

  // Get task context (all task state and handlers)
  const taskContext = useTaskContext();
  const {
    tasks,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    handleReorderTasks,
    handleDragStart,
    handleDragEnd,
    handleDropOnGrid,
    isDragging
  } = taskContext;

  // Compute week days (memoized)
  const currentWeekDays = useMemo(
    () => getWeekDays(currentDate),
    [currentDate]
  );

  // Today's date string (adjusted for late-night workers - day ends at 5am)
  const todayStr = useMemo(
    () => formatDate(getAdjustedDate()),
    []
  );

  // Unique key for the week (used for animation keys)
  const weekKey = useMemo(
    () => formatDate(currentWeekDays[0]),
    [currentWeekDays]
  );

  // Compute daily stats (memoized, recomputes when tasks or week changes)
  const dailyStats = useMemo(
    () => computeWeekStats(tasks, currentWeekDays, TARGET_HOURS_PER_DAY),
    [tasks, currentWeekDays]
  );

  // Wrap actions in stable callbacks
  const actions: PlannerActions = useMemo(() => ({
    onDropOnGrid: handleDropOnGrid,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onToggleTaskComplete: toggleTaskComplete,
    onUpdateTask: updateTask,
    onDeleteTask: deleteTask,
    onReorderTasks: handleReorderTasks,
    onFreezeOverloaded: () => {
      const todayStr = new Date().toISOString().split('T')[0];
      (tasks || []).forEach((task) => {
        if (!task) return;
        if (task.status === 'completed') return;
        if (!task.dueDate) return;
        if (task.dueDate > todayStr) return;

        updateTask(task.id, {
          status: 'unscheduled',
          dueDate: null,
          assignedRow: null,
          eisenhowerQuad: null,
          isFrozen: true
        });
      });
    }
  }), [
    handleDropOnGrid,
    handleDragStart,
    handleDragEnd,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    handleReorderTasks,
    tasks
  ]);

  return {
    // Data
    tasks,
    currentWeekDays,
    todayStr,
    weekKey,
    dailyStats,
    isDragging,
    // Actions
    actions
  };
}

// ============================================================================
// Selector Helpers (for filtering tasks in specific views)
// ============================================================================

/**
 * Get tasks for a specific day
 * Useful for MobileDayView where you show one day at a time
 */
export function selectTasksForDay(tasks: Task[], dateStr: string): Task[] {
  return tasks.filter(
    t => t.dueDate === dateStr && t.status !== 'unscheduled'
  );
}

/**
 * Get tasks for a specific day and row
 * Useful for rendering grid cells
 */
export function selectTasksForCell(
  tasks: Task[],
  dateStr: string,
  row: GridRow,
  viewMode: 'show' | 'fade' | 'hide'
): Task[] {
  return tasks.filter(t => {
    if (t.dueDate !== dateStr) return false;
    if (t.assignedRow !== row) return false;
    if (t.status === 'unscheduled') return false;
    
    // Handle completed task visibility
    if (t.status === 'completed' && viewMode === 'hide') return false;
    
    return true;
  });
}

/**
 * Check if a task should be visually faded (completed + fade mode)
 */
export function isTaskFaded(task: Task, viewMode: 'show' | 'fade' | 'hide'): boolean {
  return task.status === 'completed' && viewMode === 'fade';
}
