import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { Task } from '../../../types';
import { ROW_CONFIG, TASK_CARD_BORDER_COLORS } from '../../../constants';
import { useCompletionSound } from '../../../hooks/useCompletionSound';

interface TimelineBlockProps {
    task: Task;
    topOffset: number;
    height: number;
    viewMode: 'show' | 'fade' | 'hide';
    onToggleComplete: (taskId: string) => void;
    onTap: (task: Task) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onSelectTask?: (taskId: string) => void;
}

const MIN_BLOCK_HEIGHT = 24;

const getTypeColor = (type: string): string => {
    // Keep for fallback or just remove if unused
    return '#64748b';
};

function parseTime(timeStr: string | undefined): { hour: number; minute: number } | null {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
}

function formatTime(hour: number, minute: number): string {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m} ${ampm}`;
}

export const TimelineBlock = React.memo<TimelineBlockProps>(({
    task,
    topOffset,
    height,
    viewMode,
    onToggleComplete,
    onTap,
    onDragStart,
    onSelectTask
}) => {
    const isCompleted = task.status === 'completed';
    const isFaded = isCompleted && viewMode === 'fade';
    const rowConfig = task.assignedRow ? ROW_CONFIG[task.assignedRow] : null;
    const { play } = useCompletionSound();

    // Get border color class
    const borderColorClass = TASK_CARD_BORDER_COLORS[task.type] || 'border-l-zinc-500';

    const handleComplete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isCompleted) play();
        onToggleComplete(task.id);
    }, [task.id, isCompleted, onToggleComplete, play]);

    // Parse scheduled time for display
    const parsedTime = parseTime(task.scheduledTime);
    const timeLabel = parsedTime ? formatTime(parsedTime.hour, parsedTime.minute) : '';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isFaded ? 0.4 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute left-1 right-1 rounded-xl overflow-hidden cursor-pointer border-l-[4px] ${borderColorClass} bg-white/[0.04] border-y border-r border-white/[0.08]`}
            style={{
                top: topOffset,
                height: Math.max(height, MIN_BLOCK_HEIGHT),
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 10
            }}
            onDragStart={(e: any) => onDragStart(e, task.id)}
            draggable
            onClick={(e) => {
                // Prevent bubbling if needed, though usually fine
                // e.stopPropagation(); 
                onSelectTask?.(task.id);
            }}
        >
            <div className="flex items-center h-full px-3 gap-2">
                {/* Checkbox */}
                <button
                    onClick={handleComplete}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                        borderColor: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                        backgroundColor: isCompleted ? 'var(--success)' : 'transparent'
                    }}
                >
                    {isCompleted && <CheckCircle2 size={12} className="text-white" />}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-sm font-semibold truncate ${isCompleted ? 'line-through' : ''}`}
                            style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                            {task.title}
                        </span>
                    </div>
                    {height >= 40 && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {timeLabel} · {task.duration}m
                            </span>
                        </div>
                    )}
                </div>

                {/* Drag Handle */}
                <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            </div>
        </motion.div>
    );
});

TimelineBlock.displayName = 'TimelineBlock';
