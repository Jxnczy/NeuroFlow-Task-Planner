import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, List, Clock } from 'lucide-react';
import { TARGET_HOURS_PER_DAY, DAYS, formatDate } from '../../../constants';
import { WeekStackedView } from './WeekStackedView';
import { WeekMatrixView } from './WeekMatrixView';
import DayTimelineView from './DayTimelineView';
import { usePlannerController, DailyStats } from '../../../hooks/usePlannerController';

// ============================================================================
// Types
// ============================================================================

interface WeekViewProps {
  /** Current date to center the week view on */
  currentDate: Date;
  /** Direction of week navigation (for animation) */
  weekDirection: 'next' | 'prev';
  /** Toggle between stacked (vertical) and matrix (grid) layout */
  isStacked: boolean;
  /** How to handle completed tasks: show, fade, or hide */
  viewMode: 'show' | 'fade' | 'hide';
  /** Day view mode: list or timeline */
  dayViewMode: 'list' | 'timeline';
  /** Callback when day view mode changes */
  onDayViewModeChange: (mode: 'list' | 'timeline') => void;
}

// ============================================================================
// Presentational Sub-Components
// ============================================================================

interface DayHeaderProps {
  day: Date;
  dayIndex: number;
  stats: DailyStats;
  isToday: boolean;
  isPastDay: boolean;
}

/**
 * DayHeader - Renders a single day column header with date and stats
 * Pure presentational component - no hooks or state
 */
const DayHeader: React.FC<DayHeaderProps> = React.memo(({
  day,
  dayIndex,
  stats,
  isToday,
  isPastDay
}) => {
  const isSubtle = isPastDay;

  return (
    <div className="flex-1 min-w-0 flex flex-col text-center relative group">
      <div
        className="flex flex-col items-center py-3 rounded-t-2xl transition-all duration-300 relative"
        style={{
          background: isToday ? 'rgba(255,255,255,0.02)' : 'transparent',
          borderLeft: isToday ? '1px solid rgba(255,255,255,0.05)' : 'none',
          borderRight: isToday ? '1px solid rgba(255,255,255,0.05)' : 'none',
          borderTop: isToday ? '1px solid rgba(255,255,255,0.05)' : 'none',
          boxShadow: isToday ? '0 0 20px rgba(34,211,238,0.15)' : 'none',
          zIndex: isToday ? 10 : 'auto',
          opacity: isPastDay ? 0.85 : 1
        }}
      >
        {/* Day Name */}
        <span
          className="text-[11px] font-black uppercase tracking-widest mb-0.5"
          style={{
            color: isToday ? 'var(--accent)' : 'var(--text-muted)',
            opacity: isToday ? 1 : 0.6
          }}
        >
          {DAYS[dayIndex]}
        </span>

        {/* Date Number */}
        <span
          className="text-4xl font-display font-black leading-none transition-all duration-300"
          style={{
            color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
            textShadow: isToday ? '0 0 20px rgba(255,255,255,0.2)' : 'none',
            opacity: isToday ? 1 : 0.5
          }}
        >
          {day.getDate()}
        </span>

        {/* Workload Indicator */}
        <div className="w-full mt-3 flex flex-col items-center gap-1.5">
          <div
            className="text-xs font-extrabold transition-colors"
            style={{
              color: stats.isOverCapacity
                ? 'var(--error)'
                : stats.isNearCapacity
                  ? 'var(--warning)'
                  : 'var(--text-muted)',
              opacity: stats.totalMinutes > 0 ? 1 : 0.4
            }}
          >
            {stats.totalMinutes > 0
              ? `${stats.plannedHours}h / ${TARGET_HOURS_PER_DAY}h`
              : '—'
            }
          </div>

          {stats.totalMinutes > 0 && (isToday || isPastDay) && (
            <div className="w-full flex flex-col items-center gap-1">
              {/* Progress Bar */}
              <div
                className="w-full h-2 rounded-full overflow-hidden relative"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  className="absolute left-0 top-0 bottom-0 rounded-full"
                  initial={false}
                  animate={{
                    width: `${stats.completionPercent}%`,
                    backgroundColor: stats.completionColor,
                    opacity: isSubtle ? 0.4 : 1,
                    boxShadow: (stats.completionPercent > 0 && !isSubtle)
                      ? `0 0 10px ${stats.completionColor}50`
                      : 'none'
                  }}
                  transition={{ type: "spring", stiffness: 40, damping: 15 }}
                />
              </div>

              {/* Completion Label */}
              <div
                className="flex items-center gap-1"
                style={{ opacity: isSubtle ? 0.4 : 1 }}
              >
                {stats.completionPercent >= 100 && (
                  <CheckCircle2 size={12} style={{ color: stats.completionColor }} />
                )}
                <span
                  className="text-[11px] font-extrabold"
                  style={{ color: stats.completionColor }}
                >
                  {stats.completionPercent}% done
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DayHeader.displayName = 'DayHeader';

// ============================================================================
// Main Component
// ============================================================================

/**
 * WeekView - Weekly planner grid component
 * 
 * This is a purely presentational component that:
 * - Consumes data from usePlannerController hook
 * - Renders the week header with daily stats
 * - Delegates grid rendering to WeekMatrixView or WeekStackedView
 * 
 * All business logic (task management, drag & drop, stats computation)
 * is handled by the usePlannerController hook, making this component
 * easy to test and maintain.
 */
export const WeekView: React.FC<WeekViewProps> = React.memo(({
  currentDate,
  weekDirection,
  isStacked,
  viewMode,
  dayViewMode,
  onDayViewModeChange
}) => {
  // Get all data and actions from the controller hook
  const {
    tasks,
    currentWeekDays,
    todayStr,
    weekKey,
    dailyStats,
    actions
  } = usePlannerController({ currentDate });

  // Selected day for timeline view (defaults to today or first day of week)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayIndex = currentWeekDays.findIndex(d => formatDate(d) === todayStr);
    return todayIndex >= 0 ? todayIndex : 0;
  });

  // Destructure actions for cleaner JSX
  const {
    onDropOnGrid,
    onDragStart,
    onDragEnd,
    onToggleTaskComplete,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks
  } = actions;

  return (
    <div
      className="flex flex-col h-full font-sans overflow-hidden"
      style={{ color: 'var(--text-secondary)' }}
      data-tour="week-view"
    >
      <div className="flex-grow flex flex-col px-4 pb-4 overflow-hidden relative">
        {/* View Mode Toggle (top right) */}
        <div className="absolute top-2 right-0 z-10 flex items-center gap-2">
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
              title="Week Grid View"
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
              title="Day Timeline View"
            >
              <Clock size={16} />
            </button>
          </div>
        </div>

        {/* Days Header Row - clickable in timeline mode */}
        <div
          className={`flex ${isStacked ? 'pl-0' : 'pl-20'} pb-0 shrink-0 transition-all duration-300 pt-1 gap-2`}
        >
          {currentWeekDays.map((day, i) => {
            const stats = dailyStats[i];
            const isToday = stats.dateStr === todayStr;
            const isSelected = dayViewMode === 'timeline' && selectedDayIndex === i;

            // Check if day is in the past (strictly before today)
            const todayDate = new Date(todayStr);
            const currentDayDate = new Date(stats.dateStr);
            const isPastDay = currentDayDate < todayDate;

            return (
              <div
                key={stats.dateStr}
                className="flex-1 w-0"
              >
                <DayHeader
                  day={day}
                  dayIndex={i}
                  stats={stats}
                  isToday={isToday}
                  isPastDay={isPastDay}
                />
              </div>
            );
          })}
        </div>

        {/* Grid Content - Timeline or Week Grid */}
        <AnimatePresence mode="wait">
          {dayViewMode === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto mt-4"
            >
              <DayTimelineView
                tasks={tasks}
                selectedDate={currentWeekDays[selectedDayIndex]}
                todayStr={todayStr}
                viewMode={viewMode}
                onToggleComplete={onToggleTaskComplete}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            </motion.div>
          ) : isStacked ? (
            <WeekStackedView
              weekKey={weekKey}
              weekDirection={weekDirection}
              currentWeekDays={currentWeekDays}
              tasks={tasks}
              todayStr={todayStr}
              viewMode={viewMode}
              onDropOnGrid={onDropOnGrid}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onToggleTaskComplete={onToggleTaskComplete}
              onTaskDrop={onReorderTasks}
            />
          ) : (
            <WeekMatrixView
              weekKey={weekKey}
              weekDirection={weekDirection}
              currentWeekDays={currentWeekDays}
              tasks={tasks}
              todayStr={todayStr}
              viewMode={viewMode}
              onDropOnGrid={onDropOnGrid}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onToggleTaskComplete={onToggleTaskComplete}
              onTaskDrop={onReorderTasks}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

WeekView.displayName = 'WeekView';

