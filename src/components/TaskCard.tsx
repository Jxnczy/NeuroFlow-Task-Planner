import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { Task } from '../types';
import { TYPE_COLORS, TASK_CARD_BORDER_COLORS, TYPE_INDICATOR_COLORS } from '../constants';

interface TaskCardProps {
    task: Task;
    variant: 'board' | 'sidebar' | 'deepwork';
    index?: number;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onToggleComplete: (taskId: string) => void;
    onStartFocus?: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    onTaskDrop?: (sourceId: string, targetId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    variant,
    index,
    onDragStart,
    onToggleComplete,
    onStartFocus,
    onUpdateTask,
    onDeleteTask,
    onTaskDrop
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDuration, setEditedDuration] = useState(task.duration.toString());

    const isCompleted = task.status === 'completed';

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (variant === 'deepwork') return;
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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceTaskId = e.dataTransfer.getData('taskId');
        if (sourceTaskId && sourceTaskId !== task.id && onTaskDrop) {
            onTaskDrop(sourceTaskId, task.id);
        }
    };

    // Edit mode rendering
    if (isEditing) {
        return (
            <div className="relative group flex flex-col gap-1.5 p-3 rounded-lg border backdrop-blur-md bg-white/[0.06] border-white/10">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-black/20 text-sm font-medium rounded px-2 py-1 w-full focus:outline-none focus:ring-1"
                            style={{ color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={editedDuration}
                                onChange={(e) => setEditedDuration(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-black/20 text-xs rounded px-2 py-1 w-14 focus:outline-none focus:ring-1"
                                style={{ color: 'var(--text-muted)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                            />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={handleAcceptChanges}
                            className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={handleDeleteTask}
                            className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Deep work variant
    if (variant === 'deepwork') {
        const baseBg = isCompleted
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-white/[0.06] border-white/5';

        return (
            <div
                className={`${baseBg} rounded-2xl px-5 py-4 flex items-center justify-between hover:border-emerald-400/40 hover:bg-emerald-500/20 transition-colors gap-4 border`}
                onDoubleClick={handleDoubleClick}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {typeof index === 'number' && (
                        <div className="w-7 h-7 rounded-full bg-slate-800/80 text-slate-300 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                            {index + 1}
                        </div>
                    )}
                    <div className={`w-1 h-10 rounded-full ${TYPE_INDICATOR_COLORS[task.type]} flex-shrink-0`} />
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <h3 className={`font-semibold text-sm truncate transition-colors ${isCompleted ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-slate-200'}`}>
                            {task.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`uppercase tracking-wider font-bold text-[10px] ${TYPE_COLORS[task.type]}`}>
                                {task.type}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {task.duration}m
                            </span>
                        </div>
                    </div>
                </div>
                {isCompleted && (
                    <div className="text-emerald-300">
                        <Check size={20} />
                    </div>
                )}
            </div>
        );
    }

    // Board variant - Checkmark on LEFT
    if (variant === 'board') {
        return (
            <div
                draggable={!isEditing}
                onDragStart={(e) => {
                    e.dataTransfer.setData('taskId', task.id);
                    onDragStart(e, task.id);
                }}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDoubleClick={handleDoubleClick}
                className={`
                    relative group flex items-start gap-2 p-2.5 rounded-lg border backdrop-blur-md transition-all duration-200
                    cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-lg hover:z-10
                    ${isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : `bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08] ${TASK_CARD_BORDER_COLORS[task.type]} border-l-2`
                    }
                `}
            >
                {/* Checkmark on LEFT */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id);
                    }}
                    className={`
                        flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all duration-200 mt-0.5
                        ${isCompleted
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-white/[0.08] text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400'}
                    `}
                >
                    <Check size={12} strokeWidth={3} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Priority tag */}
                    <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold uppercase tracking-wider">
                                {task.type}
                            </span>
                        ) : (
                            <>
                                <div className={`w-1.5 h-1.5 rounded-full ${TYPE_INDICATOR_COLORS[task.type]}`} />
                                <span className={`text-[8px] font-bold uppercase tracking-wider ${TYPE_COLORS[task.type]}`}>
                                    {task.type}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {/* Title - Better line height */}
                    <h3 
                        className={`font-medium text-[11px] leading-relaxed transition-colors ${isCompleted ? 'text-emerald-400 line-through decoration-emerald-500/50' : ''}`}
                        style={{ color: isCompleted ? undefined : 'var(--text-primary)' }}
                    >
                        {task.title}
                    </h3>
                    
                    {/* Duration */}
                    <div className={`flex items-center gap-1 text-[9px] font-medium ${isCompleted ? 'text-emerald-500/60' : ''}`} style={{ color: isCompleted ? undefined : 'var(--text-muted)' }}>
                        <Clock size={9} />
                        <span>{task.duration}m</span>
                    </div>
                </div>
            </div>
        );
    }

    // Sidebar variant
    return (
        <div
            draggable={!isEditing}
            onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id);
                onDragStart(e, task.id);
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDoubleClick={handleDoubleClick}
            className={`
                relative group flex flex-col gap-1.5 p-3 rounded-lg border backdrop-blur-md transition-all duration-200 mb-2
                cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-md
                ${isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]'
                }
            `}
        >
            {/* Left color bar */}
            {!isCompleted && (
                <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${TYPE_INDICATOR_COLORS[task.type]}`}></div>
            )}
            
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    {/* Priority tag */}
                    <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold uppercase tracking-wider">
                                {task.type}
                            </span>
                        ) : (
                            <>
                                <div className={`w-1.5 h-1.5 rounded-full ${TYPE_INDICATOR_COLORS[task.type]}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${TYPE_COLORS[task.type]}`}>
                                    {task.type}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {/* Title */}
                    <h3 
                        className={`font-medium text-xs leading-relaxed transition-colors ${isCompleted ? 'text-emerald-400 line-through decoration-emerald-500/50' : ''}`}
                        style={{ color: isCompleted ? undefined : 'var(--text-primary)' }}
                    >
                        {task.title}
                    </h3>
                </div>
            </div>

            {/* Duration */}
            <div className={`flex items-center gap-1 text-[10px] font-medium ${isCompleted ? 'text-emerald-500/60' : ''}`} style={{ color: isCompleted ? undefined : 'var(--text-muted)' }}>
                <Clock size={10} />
                <span>{task.duration}m</span>
            </div>
        </div>
    );
};
