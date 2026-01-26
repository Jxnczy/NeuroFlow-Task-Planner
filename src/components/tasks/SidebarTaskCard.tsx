import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, CalendarDays } from 'lucide-react';
import { GridRow, Task, TaskType } from '../../types';
import { TASK_CARD_BORDER_COLORS, formatDate, getAdjustedDate } from '../../constants';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { setTaskDragData } from '../../utils/drag';

interface SidebarTaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onToggleComplete: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    onScheduleTask?: (taskId: string, date: Date, row: GridRow | null, type?: TaskType) => void;
    isMobile?: boolean;
    onCloseSidebar?: () => void;
    onLongPress?: (task: Task) => void;
    onSelectTask?: (taskId: string) => void;
}

export const SidebarTaskCard = React.memo<SidebarTaskCardProps>(({
    task,
    onDragStart,
    onDragEnd,
    onToggleComplete,
    onUpdateTask,
    onDeleteTask,
    onScheduleTask,
    isMobile,
    onCloseSidebar,
    onLongPress,
    onSelectTask
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDuration, setEditedDuration] = useState(task.duration.toString());
    const [isDragging, setIsDragging] = useState(false);
    const [showScheduleSheet, setShowScheduleSheet] = useState(false);
    const [customDate, setCustomDate] = useState(formatDate(getAdjustedDate()));
    const { play } = useCompletionSound();

    const isCompleted = task.status === 'completed';
    const isMobileView = !!isMobile;

    const getDefaultPlacement = (): { row: GridRow; type: TaskType } => {
        switch (task.type) {
            case 'high': return { row: 'GOAL', type: 'high' };
            case 'medium': return { row: 'FOCUS', type: 'medium' };
            case 'low': return { row: 'WORK', type: 'low' };
            case 'leisure': return { row: 'LEISURE', type: 'leisure' };
            case 'chores': return { row: 'CHORES', type: 'chores' };
            case 'backlog':
            default:
                return { row: 'FOCUS', type: 'medium' };
        }
    };

    const scheduleForDate = (date: Date) => {
        if (!onScheduleTask) return;
        const { row, type } = getDefaultPlacement();
        onScheduleTask(task.id, date, row, type);
        setShowScheduleSheet(false);
        onCloseSidebar?.();
    };

    const handleQuickSchedule = (offsetDays: number) => {
        const base = getAdjustedDate();
        base.setDate(base.getDate() + offsetDays);
        scheduleForDate(base);
    };

    const handleCustomSchedule = () => {
        if (!customDate) return;
        const parsed = new Date(customDate);
        if (isNaN(parsed.getTime())) return;
        scheduleForDate(parsed);
    };

    const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        setIsEditing(true);
        setEditedTitle(task.title);
        setEditedDuration(task.duration.toString());
    };

    const handleClick = (e: React.MouseEvent) => {
        // Don't trigger if tapping on a button or in edit mode
        const target = e.target as HTMLElement;
        if (target.closest('button') || isEditing) {
            return;
        }

        if (isMobileView) {
            // Mobile logic: tap specific
            handleTap(e);
            return;
        }

        // Desktop logic: delayed click
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return; // Double click will fire
        }

        clickTimeoutRef.current = setTimeout(() => {
            if (onSelectTask) onSelectTask(task.id);
            clickTimeoutRef.current = null;
        }, 250);
    };

    const handleAcceptChanges = () => {
        const duration = parseInt(editedDuration) || task.duration;
        if (onUpdateTask) {
            onUpdateTask(task.id, {
                title: editedTitle.trim() || task.title,
                duration
            });
        }
        setIsEditing(false);
    };

    const handleDeleteTask = () => {
        if (onDeleteTask) {
            onDeleteTask(task.id);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAcceptChanges();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        setTaskDragData(e, task.id);
        setIsDragging(true);
        onDragStart(e, task.id);

        // Delay opacity change
        setTimeout(() => {
            if (e.target) {
                (e.target as HTMLElement).style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).style.opacity = '1';
        if (onDragEnd) {
            onDragEnd(e);
        }
    };

    // Handle tap on mobile - open action sheet directly (like taskboard)
    const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        // Don't trigger if tapping on a button or in edit mode
        const target = e.target as HTMLElement;
        if (target.closest('button') || isEditing) {
            return;
        }
        if (isMobileView && onLongPress) {
            onLongPress(task);
        }
    }, [isMobileView, onLongPress, task, isEditing]);

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        if (remaining === 0) return `${hours}h`;
        return `${hours}h ${remaining}m`;
    };

    if (isEditing) {
        return (
            <div
                className="relative flex flex-col gap-2 p-3 rounded-xl border backdrop-blur-md animate-in zoom-in-95 duration-200"
                style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 90%, transparent)',
                    borderColor: 'var(--accent)'
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0 flex-1 gap-2">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-black/20 text-sm font-medium rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 transition-all"
                            style={{
                                color: 'var(--text-primary)',
                                '--tw-ring-color': 'var(--accent)'
                            } as React.CSSProperties}
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={editedDuration}
                                onChange={(e) => setEditedDuration(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-black/20 text-xs rounded-lg px-3 py-1.5 w-16 focus:outline-none focus:ring-1 transition-all"
                                style={{
                                    color: 'var(--text-muted)',
                                    '--tw-ring-color': 'var(--accent)'
                                } as React.CSSProperties}
                            />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1.5">
                            <button
                                onClick={handleAcceptChanges}
                                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                                title="Save changes"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 rounded-lg bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 transition-all"
                                title="Cancel editing"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <button
                            onClick={handleDeleteTask}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all text-[10px] font-bold uppercase"
                            title="Delete task"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            data-task-card
            draggable={!isEditing && !isMobileView}
            onDragStart={isMobileView ? undefined : handleDragStart}
            onDragEnd={isMobileView ? undefined : handleDragEnd}
            onDoubleClick={handleDoubleClick}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: isMobileView ? 'auto' : 'none',
                cursor: isEditing || isMobileView ? 'default' : 'grab',
                // GPU acceleration for smooth 60fps dragging
                willChange: 'transform',
                transform: 'translateZ(0)',
            }}
            className={`
                relative flex flex-col gap-2 p-3 rounded-xl border
                cursor-grab active:cursor-grabbing
                hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]
                transition-all duration-150
                ${isDragging ? 'opacity-50 scale-[0.98]' : ''}
                ${isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : `bg-[var(--bg-secondary)] border-[var(--border-light)] ${TASK_CARD_BORDER_COLORS[task.type]} border-l-[3px]`
                }
            `}
            onClick={handleClick}
        >
            <div className="flex items-center gap-2.5">
                <h3
                    className={`flex-1 font-medium text-base leading-snug line-clamp-2 ${isCompleted ? 'text-emerald-400/70' : ''}`}
                    style={{ color: isCompleted ? undefined : 'var(--text-primary)' }}
                >
                    {task.title}
                </h3>
            </div>

            <div className="flex items-center justify-between gap-2">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : ''}`}
                    style={{
                        backgroundColor: isCompleted ? undefined : 'rgba(255,255,255,0.05)',
                        color: isCompleted ? undefined : 'var(--text-secondary)'
                    }}
                >
                    <Clock size={11} />
                    {formatDuration(task.duration)}
                </span>
            </div>
            {isMobileView && (
                <AnimatePresence>
                    {showScheduleSheet && (
                        <>
                            <motion.div
                                className="fixed inset-0 z-50 bg-black/60"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowScheduleSheet(false)}
                            />
                            <motion.div
                                className="fixed inset-x-0 bottom-0 z-50 bg-[#0f1117] border-t border-zinc-800 rounded-t-2xl p-4 space-y-3 shadow-2xl"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Schedule task</div>
                                    <button
                                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                        onClick={() => setShowScheduleSheet(false)}
                                        aria-label="Close scheduler"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        className="w-full py-2.5 rounded-lg bg-white/[0.04] text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                        onClick={() => handleQuickSchedule(0)}
                                    >
                                        Today
                                    </button>
                                    <button
                                        className="w-full py-2.5 rounded-lg bg-white/[0.04] text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                        onClick={() => handleQuickSchedule(1)}
                                    >
                                        Tomorrow
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="flex-1 bg-black/30 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                    />
                                    <button
                                        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-semibold hover:brightness-110 transition-colors disabled:opacity-50"
                                        onClick={handleCustomSchedule}
                                        disabled={!customDate}
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
});
