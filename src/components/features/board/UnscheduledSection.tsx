import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Task } from '../../../types';
import { useCompletionSound } from '../../../hooks/useCompletionSound';

interface UnscheduledSectionProps {
    tasks: Task[];
    viewMode: 'show' | 'fade' | 'hide';
    onToggleComplete: (taskId: string) => void;
    onTap: (task: Task) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const getTypeColor = (type: string): string => {
    switch (type) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        case 'leisure': return '#8b5cf6';
        case 'chores': return '#6b7280';
        default: return '#64748b';
    }
};

export const UnscheduledSection: React.FC<UnscheduledSectionProps> = ({
    tasks,
    viewMode,
    onToggleComplete,
    onTap,
    onDragStart
}) => {
    const { play } = useCompletionSound();

    if (tasks.length === 0) return null;

    return (
        <div
            className="mb-4 p-3 rounded-[var(--radius-lg)]"
            style={{
                backgroundColor: 'var(--surface)',
                border: '1px dashed var(--border)'
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Anytime Today
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-2">
                {tasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isFaded = isCompleted && viewMode === 'fade';
                    const typeColor = getTypeColor(task.type);

                    return (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isFaded ? 0.4 : 1 }}
                            className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] cursor-pointer"
                            style={{
                                backgroundColor: 'var(--surface2)',
                                borderLeft: `3px solid ${typeColor}`
                            }}
                            onClick={() => onTap(task)}
                            whileTap={{ scale: 0.99 }}
                            draggable
                            onDragStart={(e) => {
                                // Add visible style for dragging
                                e.currentTarget.style.opacity = '0.5';
                                onDragStart(e, task.id);
                            }}
                            onDragEnd={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCompleted) play();
                                    onToggleComplete(task.id);
                                }}
                                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{
                                    borderColor: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                                    backgroundColor: isCompleted ? 'var(--success)' : 'transparent'
                                }}
                            >
                                {isCompleted && <CheckCircle2 size={10} className="text-white" />}
                            </button>
                            <span
                                className={`text-sm flex-1 truncate ${isCompleted ? 'line-through' : ''}`}
                                style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}
                            >
                                {task.title}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {task.duration}m
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
