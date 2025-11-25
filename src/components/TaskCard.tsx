import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { Task } from '../types';
import { TYPE_COLORS, TASK_CARD_BORDER_COLORS, TYPE_INDICATOR_COLORS } from '../constants';

interface TaskCardProps {
    task: Task;
    variant: 'board' | 'sidebar';
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

    // Base styles
    const baseStyles = "relative group flex flex-col gap-2 p-3 rounded-xl border backdrop-blur-md transition-all duration-300";

    // Dragging styles - disable when editing
    const dragStyles = isEditing ? "cursor-default" : "cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-lg hover:z-10";

    // Variant styles
    const variantStyles = variant === 'board'
        ? `bg-white/[0.06] border-white/5 hover:bg-white/[0.08] hover:scale-[1.02] hover:shadow-lg hover:z-10`
        : `bg-white/[0.06] border-white/5 hover:bg-white/[0.08] mb-2`;

    // Completion styles
    const completionStyles = isCompleted
        ? 'opacity-70 grayscale-[0.2]'
        : 'opacity-100';

    // Edit mode rendering
    if (isEditing) {
        return (
            <div className={`${baseStyles} ${variantStyles} cursor-default`}>
                <div className="flex items-start justify-between gap-2">
                    {/* Edit Form Left */}
                    <div className="flex flex-col min-w-0 flex-1 gap-2">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-xs text-slate-200 font-medium outline-none focus:border-cyan-500"
                            placeholder="Task name"
                            autoFocus
                        />
                        <input
                            type="number"
                            value={editedDuration}
                            onChange={(e) => setEditedDuration(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-[9px] text-slate-400 outline-none focus:border-cyan-500 w-16"
                            placeholder="Time (min)"
                        />
                    </div>

                    {/* Action Buttons Right */}
                    <div className="flex items-start gap-1 shrink-0">
                        <button
                            onClick={handleAcceptChanges}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                            title="Accept changes"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={handleDeleteTask}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all"
                            title="Delete task"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Progress/Indicator Bar for Sidebar variant */}
                {variant === 'sidebar' && (
                    <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${TYPE_INDICATOR_COLORS[task.type]}`}></div>
                )}
            </div>
        );
    }

    // Normal mode rendering
    return (
        <div
            draggable={!isEditing}
            onDragStart={(e) => !isEditing && onDragStart(e, task.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onDoubleClick={handleDoubleClick}
            className={`${baseStyles} ${dragStyles} ${variantStyles} ${completionStyles}`}
        >
            <div className="flex items-start justify-between gap-2">
                {/* Content Left */}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={`
                        font-medium truncate leading-tight transition-colors
                        ${variant === 'sidebar' ? 'text-sm text-white' : 'text-xs'} 
                        ${isCompleted ? 'line-through text-emerald-500' : 'text-slate-200'}
                    `}>
                        {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${TYPE_COLORS[task.type]}`}>
                            {task.type}
                        </span>
                        {task.duration > 0 && (
                            <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                                <Clock size={8} />
                                {task.duration}m
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Right (Checkbox & Play) */}
                <div className="flex items-start gap-1 shrink-0">
                    {onStartFocus && !isCompleted && (
                        <button
                            onClick={() => onStartFocus(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                            title="Start Focus"
                        >
                            <Play size={12} fill="currentColor" />
                        </button>
                    )}

                    <button
                        onClick={() => onToggleComplete(task.id)}
                        className={`p-0.5 transition-colors ${isCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
                    >
                        <CheckCircle2 size={18} className={isCompleted ? 'fill-emerald-400/20' : ''} />
                    </button>
                </div>
            </div>

            {/* Progress/Indicator Bar for Sidebar variant */}
            {variant === 'sidebar' && (
                <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${TYPE_INDICATOR_COLORS[task.type]}`}></div>
            )}
        </div>
    );
};
