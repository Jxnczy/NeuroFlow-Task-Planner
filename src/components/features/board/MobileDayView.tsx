import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { CheckCircle2, Clock, GripVertical } from 'lucide-react';
import { Task, GridRow } from '../../../types';
import { formatDate, ROW_CONFIG } from '../../../constants';
import { MobileActionSheet, ActionSheetAction } from './MobileActionSheet';
import { useCompletionSound } from '../../../hooks/useCompletionSound';

// ============================================================================
// Types
// ============================================================================

interface MobileDayViewProps {
  /** Tasks filtered for the selected day */
  tasks: Task[];
  /** Currently selected date */
  selectedDate: Date;
  /** Today's date string */
  todayStr: string;
  /** Direction for animation (1 = right/future, -1 = left/past) */
  direction: number;
  /** View mode for completed tasks */
  viewMode: 'show' | 'fade' | 'hide';
  /** Callback to navigate to next day */
  onNextDay: () => void;
  /** Callback to navigate to previous day */
  onPrevDay: () => void;
  /** Callback to toggle task completion */
  onToggleComplete: (taskId: string) => void;
  /** Callback to update task */
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  /** Callback to delete task */
  onDeleteTask: (taskId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

interface MobileTaskCardProps {
  task: Task;
  isPastDay: boolean;
  viewMode: 'show' | 'fade' | 'hide';
  onToggleComplete: (taskId: string) => void;
  onLongPress: (task: Task) => void;
  onSelectTask?: (taskId: string) => void;
}

// ============================================================================
// Animation Variants
// ============================================================================

const listVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  })
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  }),
  exit: { opacity: 0, y: -10 }
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * MobileTaskCard - Individual task card with swipe gestures
 * 
 * Swipe right: Complete task
 * Long press: Open action sheet
 */
const MobileTaskCard: React.FC<MobileTaskCardProps> = React.memo(({
  task,
  isPastDay,
  viewMode,
  onToggleComplete,
  onLongPress,
  onSelectTask
}) => {
  const [flash, setFlash] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const { play } = useCompletionSound();

  const isCompleted = task.status === 'completed';
  const isFaded = isCompleted && (viewMode === 'fade' || isPastDay);

  // Get row config for icon/color
  const rowConfig = task.assignedRow ? ROW_CONFIG[task.assignedRow] : null;

  // Type color for left border
  const getTypeColor = () => {
    const colorMap: Record<string, string> = {
      high: '#f43f5e',
      medium: '#f97316',
      low: '#facc15',
      leisure: '#22d3ee',
      chores: '#a1a1aa',
      backlog: '#6b7280'
    };
    return colorMap[task.type] || colorMap.backlog;
  };

  // Track if user is dragging (to distinguish tap from swipe)
  const didSwipe = useRef(false);

  // Swipe gesture handler
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    setSwipeX(info.offset.x);
    // Mark as swiping if moved more than 10px
    if (Math.abs(info.offset.x) > 10) {
      didSwipe.current = true;
    }
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const swipeThreshold = 100;

    // Swipe right to complete
    if (info.offset.x > swipeThreshold && !isCompleted) {
      play();
      onToggleComplete(task.id);
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30);
    }

    setSwipeX(0);
  }, [isCompleted, play, onToggleComplete, task.id]);

  // Long press & Tap logic
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore if tapping a button (like the checkbox)
    if ((e.target as HTMLElement).closest('button')) return;

    isLongPress.current = false;
    // didSwipe.current is reset in handleDragStart, but we reset here too just in case
    // didSwipe.current = false; // Actually better to rely on drag start/move for swipe detection

    startPos.current = { x: e.clientX, y: e.clientY };

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress(task);
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      // If moved > 10px, cancel long press (it's likely a scroll or swipe)
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If it wasn't a long press and we didn't swipe/drag, treat as Tap
    if (!isLongPress.current && !didSwipe.current) {
      if (!(e.target as HTMLElement).closest('button')) {
        if (onSelectTask) onSelectTask(task.id);
      }
    }

    // Reset flags
    isLongPress.current = false;
  };

  // Reset swipe tracking on drag start
  const handleDragStart = useCallback(() => {
    didSwipe.current = false;
    // Cancel long press if drag starts
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Calculate swipe progress for visual feedback
  const swipeProgress = Math.min(Math.max(swipeX / 100, 0), 1);
  const showSwipeHint = swipeX > 20 && !isCompleted;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe background (green for complete) */}
      <motion.div
        className="absolute inset-0 flex items-center pl-4 rounded-xl"
        style={{
          backgroundColor: `rgba(16, 185, 129, ${swipeProgress * 0.8})`,
        }}
        animate={{ opacity: showSwipeHint ? 1 : 0 }}
      >
        <motion.div
          animate={{
            scale: showSwipeHint ? 1 : 0.8,
            opacity: showSwipeHint ? 1 : 0
          }}
          className="text-white font-semibold flex items-center gap-2"
        >
          <CheckCircle2 size={20} />
          {swipeProgress > 0.8 && <span>Complete!</span>}
        </motion.div>
      </motion.div>

      {/* Card content (swipeable) */}
      <motion.div
        className={`
          relative rounded-xl overflow-hidden
          transition-shadow duration-200
          bg-white/[0.04] border-y border-r border-white/[0.08]
        `}
        style={{
          opacity: isFaded ? 0.5 : 1,
          borderLeft: `3px solid ${getTypeColor()}`,
          minHeight: '56px',
          x: swipeX > 0 ? swipeX : 0
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 150 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center p-4 gap-3 relative">
          {/* Completion Checkbox - larger touch target */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task.status !== 'completed') {
                play();
              }
              onToggleComplete(task.id);
              setFlash(true);
              window.setTimeout(() => setFlash(false), 300);
            }}
            className={`
              w-7 h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-200 shrink-0 touch-manipulation
            `}
            style={{
              borderColor: isCompleted ? 'var(--success)' : 'rgba(255,255,255,0.25)',
              backgroundColor: isCompleted ? 'var(--success)' : 'transparent'
            }}
          >
            {isCompleted && (
              <CheckCircle2 size={16} className="text-white" />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h4
              className={`
                font-semibold text-sm leading-tight
                ${isCompleted ? 'line-through' : ''}
              `}
              style={{
                color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)'
              }}
            >
              {task.title}
            </h4>

            <div className="flex items-center gap-2 mt-1.5">
              {/* Duration */}
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Clock size={12} />
                <span>{task.duration}m</span>
              </div>

              {/* Row/Category badge with icon */}
              {rowConfig && (
                <span
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: rowConfig.color
                  }}
                >
                  {React.createElement(rowConfig.icon, { size: 10 })}
                  {task.assignedRow}
                </span>
              )}
            </div>
          </div>

          {/* Swipe hint indicator */}
          <div
            className="opacity-20 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            ⟩
          </div>
        </div>

        {/* Completion flash animation */}
        <AnimatePresence>
          {flash && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-emerald-500/20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

MobileTaskCard.displayName = 'MobileTaskCard';

// ============================================================================
// Row Section Component
// ============================================================================

interface RowSectionProps {
  row: GridRow;
  tasks: Task[];
  isPastDay: boolean;
  viewMode: 'show' | 'fade' | 'hide';
  onToggleComplete: (taskId: string) => void;
  onLongPress: (task: Task) => void;
  onSelectTask?: (taskId: string) => void;
}

const RowSection: React.FC<RowSectionProps> = React.memo(({
  row,
  tasks,
  isPastDay,
  viewMode,
  onToggleComplete,
  onLongPress,
  onSelectTask
}) => {
  const config = ROW_CONFIG[row];
  const Icon = config.icon;

  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Row Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon size={16} className={config.color} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {config.label}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', opacity: 0.5 }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task Cards */}
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={index}
          >
            <MobileTaskCard
              task={task}
              isPastDay={isPastDay}
              viewMode={viewMode}
              onToggleComplete={onToggleComplete}
              onLongPress={onLongPress}
              onSelectTask={onSelectTask}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
});

RowSection.displayName = 'RowSection';

// ============================================================================
// Main Component
// ============================================================================

/**
 * MobileDayView - Swipeable day task list
 * 
 * Displays tasks grouped by row (GOAL, FOCUS, WORK, etc.)
 * Supports swipe gestures to navigate between days.
 * Long-press on cards triggers action sheet.
 */
export const MobileDayView: React.FC<MobileDayViewProps> = ({
  tasks,
  selectedDate,
  todayStr,
  direction,
  viewMode,
  onNextDay,
  onPrevDay,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onSelectTask
}) => {
  const [actionSheetTask, setActionSheetTask] = useState<Task | null>(null);

  const selectedDateStr = formatDate(selectedDate);
  const isPastDay = selectedDateStr < todayStr;

  // Filter tasks for this day
  const dayTasks = (tasks || []).filter(t => {
    if (!t || !t.id) return false;
    // Skip any placeholder/ghost items that might leak from desktop logic
    if ((t as any).isPlaceholder || (t as any).isGhost) return false;
    if (t.isFrozen) return false;
    if (t.dueDate !== selectedDateStr) return false;
    if (t.status === 'unscheduled') return false;
    if (t.status === 'completed' && viewMode === 'hide') return false;
    return true;
  });

  // Group tasks by row
  const rows: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];
  const tasksByRow = rows.reduce((acc, row) => {
    acc[row] = dayTasks.filter(t => t.assignedRow === row);
    return acc;
  }, {} as Record<GridRow, Task[]>);

  // Tasks without a row (scheduled but no row assigned)
  const unassignedTasks = dayTasks.filter(t => !t.assignedRow || !rows.includes(t.assignedRow));

  // Swipe gesture handler
  const handleDragEnd = useCallback((
    _event: any,
    info: any
  ) => {
    const threshold = 50;
    const velocity = 500;

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swiped left -> next day
      onNextDay();
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swiped right -> previous day
      onPrevDay();
    }
  }, [onNextDay, onPrevDay]);

  // Long press handler
  const handleLongPress = useCallback((task: Task) => {
    // Haptic feedback (if available)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setActionSheetTask(task);
  }, []);

  // Action sheet handler
  const handleAction = useCallback((action: ActionSheetAction, task: Task) => {
    switch (action) {
      case 'complete':
        onToggleComplete(task.id);
        break;
      case 'move-tomorrow': {
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        onUpdateTask(task.id, {
          dueDate: formatDate(tomorrow),
          status: 'scheduled'
        });
        break;
      }
      case 'move-yesterday': {
        // This is actually "Move to Today" in mobile
        const today = new Date();
        onUpdateTask(task.id, {
          dueDate: formatDate(today),
          status: 'scheduled'
        });
        break;
      }
      case 'delete':
        onDeleteTask(task.id);
        break;
      case 'reschedule':
        // Handled by MobileActionSheet internally with date picker
        break;
      case 'reschedule-to-date': {
        // Date picker confirmed - task has _rescheduleDate property
        const newDate = (task as any)._rescheduleDate;
        if (newDate) {
          onUpdateTask(task.id, {
            dueDate: newDate,
            status: 'scheduled' // Ensure task shows in the new day
          });
        }
        break;
      }
      case 'edit':
        // TODO: Open edit modal
        break;
    }
    setActionSheetTask(null);
  }, [selectedDate, onToggleComplete, onUpdateTask, onDeleteTask]);

  // Check if there are any tasks
  const hasTasks = dayTasks.length > 0;

  return (
    <>
      {/* Swipeable Container */}
      <motion.div
        className="w-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={selectedDateStr}
            custom={direction}
            variants={listVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            {hasTasks ? (
              // Grouped task list
              <>
                {rows.map(row => (
                  <RowSection
                    key={row}
                    row={row}
                    tasks={tasksByRow[row]}
                    isPastDay={isPastDay}
                    viewMode={viewMode}
                    onToggleComplete={onToggleComplete}
                    onLongPress={handleLongPress}
                    onSelectTask={onSelectTask}
                  />
                ))}

                {/* Unassigned tasks (scheduled but no row) */}
                {unassignedTasks.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Scheduled
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                      >
                        {unassignedTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {unassignedTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          variants={cardVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          custom={index}
                        >
                          <MobileTaskCard
                            task={task}
                            isPastDay={isPastDay}
                            viewMode={viewMode}
                            onToggleComplete={onToggleComplete}
                            onLongPress={handleLongPress}
                            onSelectTask={onSelectTask}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Empty state
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <CheckCircle2 size={32} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isPastDay ? 'No tasks recorded' : 'No tasks scheduled'}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isPastDay
                    ? 'This day has passed'
                    : 'Drag tasks from the sidebar to plan your day'
                  }
                </p>
              </div>
            )}

            {/* Bottom padding for scroll */}
            <div className="h-20" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Action Sheet */}
      <MobileActionSheet
        task={actionSheetTask}
        onAction={handleAction}
        onClose={() => setActionSheetTask(null)}
      />
    </>
  );
};

MobileDayView.displayName = 'MobileDayView';
