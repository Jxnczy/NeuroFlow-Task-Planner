import React, { useState, useCallback, useMemo } from 'react';
import { Menu, List, Clock } from 'lucide-react';
import { usePlannerController } from '../../../hooks/usePlannerController';
import { MobileWeekStrip } from './MobileWeekStrip';
import { MobileDayView } from './MobileDayView';
import DayTimelineView from './DayTimelineView';
import { MobileActionSheet } from './MobileActionSheet';
import { MobileFAB } from '../../ui/MobileFAB';
import { formatDate } from '../../../constants';
import { Task } from '../../../types';

// ============================================================================
// Types
// ============================================================================

interface MobilePlannerProps {
  /** Current week's anchor date (for week navigation) */
  currentDate: Date;
  /** How to handle completed tasks */
  viewMode: 'show' | 'fade' | 'hide';
  /** Day view display mode: list or timeline */
  dayViewMode: 'list' | 'timeline';
  /** Callback when day view mode changes */
  onDayViewModeChange: (mode: 'list' | 'timeline') => void;
  /** Callback when week changes (optional, for sync with desktop) */
  onWeekChange?: (direction: 'prev' | 'next') => void;
  /** Opens the global sidebar (drawer on mobile) */
  onOpenSidebar?: () => void;
  onSelectTask?: (taskId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MobilePlanner - Mobile-optimized planner view
 * 
 * Combines:
 * - MobileWeekStrip: Horizontal day selector at top
 * - MobileDayView: Swipeable task list below
 * 
 * Uses usePlannerController hook for all data/actions,
 * proving the hook's portability for different view implementations.
 */
export const MobilePlanner: React.FC<MobilePlannerProps> = ({
  currentDate,
  viewMode,
  dayViewMode,
  onDayViewModeChange,
  onWeekChange,
  onOpenSidebar,
  onSelectTask
}) => {
  // Get data and actions from the controller hook
  const {
    tasks,
    currentWeekDays,
    todayStr,
    dailyStats,
    actions
  } = usePlannerController({ currentDate });

  // State for action sheet
  const [actionSheetTask, setActionSheetTask] = useState<Task | null>(null);

  // Mobile-specific state: selected day within the week
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Default to today if it's in the current week, otherwise first day
    const today = new Date(todayStr);
    const weekStart = currentWeekDays[0];
    const weekEnd = currentWeekDays[6];

    if (today >= weekStart && today <= weekEnd) {
      return today;
    }
    return weekStart;
  });

  // Track direction for animations (1 = forward, -1 = backward)
  const [direction, setDirection] = useState(0);

  // Navigate to specific date
  const handleSelectDate = useCallback((date: Date) => {
    const currentStr = formatDate(selectedDate);
    const newStr = formatDate(date);

    setDirection(newStr > currentStr ? 1 : -1);
    setSelectedDate(date);
  }, [selectedDate]);

  // Navigate to next day
  const handleNextDay = useCallback(() => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    const weekEnd = currentWeekDays[6];
    const isBeyondWeek = formatDate(nextDate) > formatDate(weekEnd);

    setDirection(1);
    setSelectedDate(nextDate);

    if (isBeyondWeek && onWeekChange) {
      onWeekChange('next');
    }
  }, [currentWeekDays, selectedDate, onWeekChange]);

  // Navigate to previous day
  const handlePrevDay = useCallback(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    const weekStart = currentWeekDays[0];
    const isBeforeWeek = formatDate(prevDate) < formatDate(weekStart);

    setDirection(-1);
    setSelectedDate(prevDate);

    if (isBeforeWeek && onWeekChange) {
      onWeekChange('prev');
    }
  }, [currentWeekDays, selectedDate, onWeekChange]);

  // Reset selected date when week changes
  React.useEffect(() => {
    const selectedStr = formatDate(selectedDate);
    const weekStart = formatDate(currentWeekDays[0]);
    const weekEnd = formatDate(currentWeekDays[6]);

    // If selected date is outside current week, reset to today or first day
    if (selectedStr < weekStart || selectedStr > weekEnd) {
      const today = new Date(todayStr);
      const todayInWeek = formatDate(today) >= weekStart && formatDate(today) <= weekEnd;

      if (todayInWeek) {
        setSelectedDate(today);
      } else if (selectedStr < weekStart) {
        // Coming from future week, select last day
        setSelectedDate(currentWeekDays[6]);
      } else {
        // Coming from past week, select first day
        setSelectedDate(currentWeekDays[0]);
      }
    }
  }, [currentWeekDays, todayStr]);

  // Format selected date for display
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };
    return selectedDate.toLocaleDateString('en-US', options);
  }, [selectedDate]);

  return (
    <div
      className="flex flex-col h-[100dvh] w-full overflow-hidden fixed inset-0"
    >
      {/* Sticky Header + Week Strip */}
      <div
        className="flex-none z-20 transition-colors duration-300 border-b"
        style={{
          backgroundColor: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenSidebar?.()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1">
              <h2
                className="text-xl font-display font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {formattedDate}
              </h2>
              {formatDate(selectedDate) === todayStr && (
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  Today
                </span>
              )}
            </div>

            {/* View Mode Toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <button
                onClick={() => onDayViewModeChange('list')}
                className="p-2 transition-all"
                style={{
                  backgroundColor: dayViewMode === 'list' ? 'var(--accent)' : 'transparent',
                  color: dayViewMode === 'list' ? 'white' : 'var(--text-muted)'
                }}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => onDayViewModeChange('timeline')}
                className="p-2 transition-all"
                style={{
                  backgroundColor: dayViewMode === 'timeline' ? 'var(--accent)' : 'transparent',
                  color: dayViewMode === 'timeline' ? 'white' : 'var(--text-muted)'
                }}
                aria-label="Timeline view"
              >
                <Clock size={16} />
              </button>
            </div>
          </div>
        </div>

        <MobileWeekStrip
          currentWeekDays={currentWeekDays}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          todayStr={todayStr}
          dailyStats={dailyStats}
          tasks={tasks}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain relative z-0 no-scrollbar">
        <div className="pb-32 px-4 pt-4">
          {dayViewMode === 'timeline' ? (
            <DayTimelineView
              tasks={tasks}
              selectedDate={selectedDate}
              todayStr={todayStr}
              viewMode={viewMode}
              onToggleComplete={actions.onToggleTaskComplete}
              onUpdateTask={actions.onUpdateTask}
              onOpenActionSheet={setActionSheetTask}
              isMobile={true}
              onSelectTask={onSelectTask}
            />
          ) : (
            <MobileDayView
              tasks={tasks}
              selectedDate={selectedDate}
              todayStr={todayStr}
              direction={direction}
              viewMode={viewMode}
              onNextDay={handleNextDay}
              onPrevDay={handlePrevDay}
              onToggleComplete={actions.onToggleTaskComplete}
              onUpdateTask={actions.onUpdateTask}
              onDeleteTask={actions.onDeleteTask}
              onSelectTask={onSelectTask}
            />
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <MobileFAB onClick={() => onOpenSidebar?.()} />

      {/* Action Sheet for Timeline view task interactions */}
      <MobileActionSheet
        task={actionSheetTask}
        onClose={() => setActionSheetTask(null)}
        onAction={(action, task) => {
          switch (action) {
            case 'complete':
              actions.onToggleTaskComplete(task.id);
              break;
            case 'move-tomorrow': {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              actions.onUpdateTask(task.id, { dueDate: tomorrowStr });
              break;
            }
            case 'move-yesterday': {
              const today = new Date().toISOString().split('T')[0];
              actions.onUpdateTask(task.id, { dueDate: today });
              break;
            }
            case 'reschedule-to-date': {
              const taskWithDate = task as Task & { _rescheduleDate?: string };
              if (taskWithDate._rescheduleDate) {
                actions.onUpdateTask(task.id, { dueDate: taskWithDate._rescheduleDate });
              }
              break;
            }
            case 'set-time': {
              const taskWithTime = task as Task & { _scheduledTime?: string };
              actions.onUpdateTask(task.id, {
                scheduledTime: taskWithTime._scheduledTime || undefined
              });
              break;
            }
            case 'delete':
              actions.onDeleteTask(task.id);
              break;
          }
          setActionSheetTask(null);
        }}
      />
    </div>
  );
};

MobilePlanner.displayName = 'MobilePlanner';


