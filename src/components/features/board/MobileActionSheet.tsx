import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Trash2,
  X,
  Calendar,
  CheckCircle2,
  CalendarCheck,
  Clock
} from 'lucide-react';
import { Task } from '../../../types';
import { MobileDatePicker } from '../../ui/MobileDatePicker';
import { MobileTimePicker } from '../../ui/MobileTimePicker';
import { formatDate } from '../../../constants';

// ============================================================================
// Types
// ============================================================================

export type ActionSheetAction =
  | 'complete'
  | 'move-tomorrow'
  | 'move-yesterday'
  | 'reschedule'
  | 'reschedule-to-date'
  | 'set-time'
  | 'edit'
  | 'delete'
  | 'cancel';

interface MobileActionSheetProps {
  /** Task to show actions for (null = hidden) */
  task: Task | null;
  /** Callback when action is selected */
  onAction: (action: ActionSheetAction, task: Task) => void;
  /** Callback to close the sheet */
  onClose: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  variant?: 'default' | 'success' | 'danger';
  onClick: () => void;
}

// ============================================================================
// Animation Variants
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const sheetVariants = {
  hidden: {
    y: '100%',
    transition: { type: 'spring', damping: 30, stiffness: 300 }
  },
  visible: {
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 }
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  sublabel,
  variant = 'default',
  onClick
}) => {
  const colorStyles = {
    default: {
      bg: 'rgba(255,255,255,0.05)',
      bgHover: 'rgba(255,255,255,0.08)',
      text: 'var(--text-primary)',
      icon: 'var(--text-secondary)'
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      bgHover: 'rgba(16, 185, 129, 0.15)',
      text: '#10b981',
      icon: '#10b981'
    },
    danger: {
      bg: 'rgba(239, 68, 68, 0.1)',
      bgHover: 'rgba(239, 68, 68, 0.15)',
      text: '#ef4444',
      icon: '#ef4444'
    }
  };

  const colors = colorStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors"
      style={{ backgroundColor: colors.bg }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ backgroundColor: colors.bgHover }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <span style={{ color: colors.icon }}>{icon}</span>
      </div>
      <div className="flex-1 text-left">
        <div
          className="font-semibold"
          style={{ color: colors.text }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </motion.button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * MobileActionSheet - iOS-style bottom action sheet
 * 
 * Triggered by long-press on a task card.
 * Provides quick actions: complete, move, edit, delete.
 */
export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  task,
  onAction,
  onClose
}) => {
  const isOpen = task !== null;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Capture the task when picker opens to prevent stale closures
  const [capturedTask, setCapturedTask] = useState<Task | null>(null);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle reschedule button - open date picker
  const handleRescheduleClick = () => {
    // Capture the task at the moment the date picker opens
    if (task) {
      setCapturedTask(task);
      setShowDatePicker(true);
    }
  };

  // Handle set time button - open time picker
  const handleTimeClick = () => {
    if (task) {
      setCapturedTask(task);
      setShowTimePicker(true);
    }
  };

  // Handle time selection from picker
  const handleTimeConfirm = (time: string) => {
    const taskToUpdate = capturedTask || task;
    if (taskToUpdate) {
      setShowTimePicker(false);
      setCapturedTask(null);
      // Pass the time via a custom property
      const taskWithTime = { ...taskToUpdate, _scheduledTime: time } as Task & { _scheduledTime: string };
      onAction('set-time', taskWithTime as any);
    }
  };

  // Handle clearing time
  const handleTimeClear = () => {
    const taskToUpdate = capturedTask || task;
    if (taskToUpdate) {
      const taskWithTime = { ...taskToUpdate, _scheduledTime: '' } as Task & { _scheduledTime: string };
      onAction('set-time', taskWithTime as any);
    }
  };

  // Handle date selection from picker
  const handleDateConfirm = (date: Date) => {
    // Use captured task to avoid stale closure issues
    const taskToMove = capturedTask || task;
    if (taskToMove) {
      // Close date picker first
      setShowDatePicker(false);
      setCapturedTask(null);
      // Format date and trigger reschedule action
      const dateStr = formatDate(date);
      // We'll pass the date via a custom property
      const taskWithDate = { ...taskToMove, _rescheduleDate: dateStr } as Task & { _rescheduleDate: string };
      onAction('reschedule-to-date', taskWithDate as any);
    }
  };

  // Get task type color
  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      high: '#f43f5e',
      medium: '#f97316',
      low: '#facc15',
      leisure: '#22d3ee',
      chores: '#a1a1aa',
      backlog: '#6b7280'
    };
    return colorMap[type] || colorMap.backlog;
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/60 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Task Preview Header */}
            <div className="px-5 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-start gap-3">
                {/* Type indicator */}
                <div
                  className="w-1 h-12 rounded-full mt-1"
                  style={{ backgroundColor: getTypeColor(task.type) }}
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-lg truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {task.title}
                  </h3>
                  <div
                    className="text-sm mt-0.5 flex items-center gap-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>{task.duration} min</span>
                    <span>•</span>
                    <span className="capitalize">{task.type}</span>
                    {task.status === 'completed' && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Completed</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <X size={18} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              {/* Complete / Uncomplete */}
              <ActionButton
                icon={<CheckCircle2 size={20} />}
                label={task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                sublabel={task.status === 'completed' ? 'Undo completion' : 'Done with this task'}
                variant="success"
                onClick={() => onAction('complete', task)}
              />

              {/* Move to Tomorrow */}
              <ActionButton
                icon={<ArrowRight size={20} />}
                label="Move to Tomorrow"
                sublabel="Reschedule for next day"
                onClick={() => onAction('move-tomorrow', task)}
              />

              {/* Move to Today */}
              <ActionButton
                icon={<CalendarCheck size={20} />}
                label="Move to Today"
                sublabel="Schedule for today"
                onClick={() => onAction('move-yesterday', task)}
              />

              {/* Reschedule - opens date picker */}
              <ActionButton
                icon={<Calendar size={20} />}
                label="Move Task"
                sublabel="Pick a different date"
                onClick={handleRescheduleClick}
              />

              {/* Set Time - opens time picker */}
              <ActionButton
                icon={<Clock size={20} />}
                label={task.scheduledTime ? `Time: ${task.scheduledTime}` : 'Set Time'}
                sublabel={task.scheduledTime ? 'Change or remove time' : 'Add to timeline view'}
                onClick={handleTimeClick}
              />

              {/* Delete */}
              <ActionButton
                icon={<Trash2 size={20} />}
                label="Delete Task"
                sublabel="Remove permanently"
                variant="danger"
                onClick={() => onAction('delete', task)}
              />
            </div>

            {/* Safe area spacer for iOS */}
            <div className="h-8" />
          </motion.div>
        </>
      )}

      {/* Date Picker Modal */}
      <MobileDatePicker
        isOpen={showDatePicker}
        initialDate={capturedTask?.dueDate ? new Date(capturedTask.dueDate) : (task?.dueDate ? new Date(task.dueDate) : new Date())}
        onConfirm={handleDateConfirm}
        onClose={() => {
          setShowDatePicker(false);
          setCapturedTask(null);
        }}
      />

      {/* Time Picker Modal */}
      <MobileTimePicker
        isOpen={showTimePicker}
        initialTime={capturedTask?.scheduledTime || task?.scheduledTime}
        onConfirm={handleTimeConfirm}
        onClose={() => {
          setShowTimePicker(false);
          setCapturedTask(null);
        }}
        onClear={task?.scheduledTime ? handleTimeClear : undefined}
      />
    </AnimatePresence>
  );
};

MobileActionSheet.displayName = 'MobileActionSheet';

