import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { Task } from '../../types';
import { TASK_CARD_BORDER_COLORS } from '../../constants';
import { setTaskDragData } from '../../utils/drag';

interface BoardTaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onToggleComplete: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    isOverdue?: boolean;
    viewMode?: 'show' | 'fade' | 'hide';
}

export const BoardTaskCard = React.memo<BoardTaskCardProps>(({
    task,
    onDragStart,
    onDragEnd,
    onToggleComplete,
    onUpdateTask,
    onDeleteTask,
    isOverdue,
    viewMode = 'show'
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDuration, setEditedDuration] = useState(task.duration.toString());
    const [isDragging, setIsDragging] = useState(false);

    const isCompleted = task.status === 'completed';

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditedTitle(task.title);
        setEditedDuration(task.duration.toString());
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

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        if (remaining === 0) return `${hours}h`;
        return `${hours}h ${remaining}m`;
    };

    // Edit mode rendering
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
                                {/* X icon manually SVG to avoid import if not needed, or import X */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
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

    const baseOpacity = isCompleted ? (viewMode === 'fade' ? 0.6 : 1) : 1;
    const hoverOpacity = isCompleted ? (viewMode === 'fade' ? 0.8 : 1) : 1;

    return (
        <div
            draggable={!isEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDoubleClick={handleDoubleClick}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
                cursor: isEditing ? 'default' : 'grab',
                opacity: isOverdue ? 1 : baseOpacity
            }}
            className={`
                hover:scale-[1.01] active:scale-[0.98] transition-all duration-150
                relative flex flex-row items-center justify-between gap-3 py-3 px-3 rounded-lg border min-h-[70px]
                cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-50 scale-[0.98]' : ''}
                ${isOverdue && !isCompleted
                    ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                    : isCompleted
                        ? 'bg-emerald-900/20 border-emerald-500/20'
                        : `bg-white/[0.04] border-white/[0.08] ${TASK_CARD_BORDER_COLORS[task.type]} border-l-[3px]`
                }
            `}
        >
            {isOverdue && !isCompleted && (
                <div className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm ring-2 ring-[#09090b]">
                    <AlertCircle size={12} strokeWidth={3} />
                </div>
            )}

            <div className="flex-1 flex items-center min-w-0">
                <h3
                    className={`font-medium text-base leading-tight whitespace-normal break-words pr-2`}
                    style={{ color: isCompleted ? '#f1f5f9' : 'var(--text-primary)' }}
                >
                    {task.title}
                </h3>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 w-12">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id);
                    }}
                    className={`
                        w-5 h-5 rounded flex items-center justify-center
                        transition-all duration-200
                        ${isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.1] text-zinc-500 hover:bg-emerald-500/20 hover:text-emerald-400'}
                    `}
                >
                    {isCompleted ? (
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1, rotate: [0, 3, 0] }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                        >
                            <Check size={14} strokeWidth={3} />
                        </motion.div>
                    ) : (
                        <Check size={14} strokeWidth={3} className="opacity-0 group-hover:opacity-100" />
                    )}
                </button>

                <span
                    className={`text-[12px] font-mono leading-none text-center pt-[0.4rem] ${isCompleted ? 'text-emerald-400/80' : 'text-zinc-500'}`}
                >
                    {formatDuration(task.duration)}
                </span>
            </div>
        </div>
    );
});
