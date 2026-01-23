import React, { useState, useMemo } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, GridRow } from '../../../types';
import { formatDate, ROW_CONFIG } from '../../../constants';
import { BoardTaskCard } from '../../tasks/BoardTaskCard';

interface GridCellProps {
    day: Date;
    row: GridRow;
    isToday: boolean;
    tasks: Task[];
    onDrop: (e: React.DragEvent, day: Date, row: GridRow) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onToggleComplete: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    isDayEmpty: boolean;
    onTaskDrop?: (sourceId: string, targetId: string) => void;
    viewMode: 'show' | 'fade' | 'hide';
    isPastDay?: boolean;
    isFirstColumn?: boolean;
}

export const GridCell = React.memo<GridCellProps>(({
    day,
    row,
    isToday,
    tasks,
    onDrop,
    onDragStart,
    onDragEnd,
    onToggleComplete,
    onUpdateTask,
    onDeleteTask,
    isDayEmpty,
    onTaskDrop,

    viewMode,
    isPastDay,
    isFirstColumn
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const dayStr = useMemo(() => formatDate(day), [day]);

    // Filter tasks for this specific cell
    // Note: In a further optimization, this filtering should happen in the parent (WeekMatrixView)
    // and passed down as `cellTasks` to avoid this filter running on every cell for every render.
    // For now, we memoize it here.
    const allCellTasks = useMemo(() =>
        (tasks || []).filter(t => t.dueDate === dayStr && t.assignedRow === row),
        [tasks, dayStr, row]);

    // Separate active tasks from rescheduled ones
    const { activeTasks, rescheduledTasks } = useMemo(() => {
        const active = [];
        const rescheduled = [];
        for (const t of allCellTasks) {
            if (t.status === 'rescheduled') {
                rescheduled.push(t);
            } else if (t.status !== 'unscheduled' && !(t.status === 'completed' && viewMode === 'hide')) {
                active.push(t);
            }
        }
        return { activeTasks: active, rescheduledTasks: rescheduled };
    }, [allCellTasks, viewMode]);

    const slotCount = row === 'GOAL' ? 1 : 3;
    const visibleTasks = activeTasks.slice(0, slotCount);
    const emptySlotsToRender = slotCount - visibleTasks.length;

    // Only set drag over on the actual cell element, not children
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Only respond if entering the cell itself
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(true);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Ensure we stay in drag over state while over the cell
        if (!isDragOver) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only leave if actually leaving the cell (not entering a child)
        const relatedTarget = e.relatedTarget as Node;
        if (!e.currentTarget.contains(relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e, day, row);
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative flex-1 w-0 flex flex-col p-1.5 pt-3 gap-1 transition-colors duration-150"
            style={{
                borderLeft: isToday ? '1px solid var(--border-light)' : (!isFirstColumn ? '1px solid var(--border-light)' : 'none'),
                borderRight: isToday ? '1px solid var(--border-light)' : (isPastDay ? '1px solid color-mix(in srgb, var(--border-light), transparent 30%)' : '1px solid var(--border-light)'),
                backgroundColor: isDragOver
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : (isToday ? 'color-mix(in srgb, var(--surface2) 55%, transparent)' : 'transparent'),
                // CSS containment for isolated repaints - improves grid performance
                contain: 'layout style',
            }}
        >
            {/* Tasks */}
            <AnimatePresence mode="popLayout">
                {visibleTasks.map((task) => (
                    <motion.div
                        key={task.id}
                        className="flex-1 min-h-0"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <BoardTaskCard
                            task={task}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onToggleComplete={onToggleComplete}
                            isOverdue={isPastDay && task.status !== 'completed'}
                            viewMode={viewMode}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Drop Indicator - Fills remaining space */}
            {
                isDragOver && emptySlotsToRender > 0 && (
                    <div
                        className={`relative w-full min-h-0 border border-dashed rounded-[var(--radius-sm)] pointer-events-none z-20 flex items-center justify-center animate-in fade-in duration-200 ${ROW_CONFIG[row].barColor.replace('bg-', 'border-')}`}
                        style={{
                            flex: emptySlotsToRender,
                            backgroundColor: 'color-mix(in srgb, var(--surface2) 55%, transparent)'
                        }}
                    >
                        <span
                            className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${ROW_CONFIG[row].barColor} text-white`}
                        >
                            Drop
                        </span>
                    </div>
                )
            }

            {/* Empty slots */}
            {
                emptySlotsToRender > 0 && !isDragOver && (
                    <>
                        {/* Use a simple loop instead of Array.from to avoid allocation if possible, 
                            but React needs keys. We can use a stable array if max slots is small. 
                            Since max slots is 3, we can just map over a small range. */}
                        {[...Array(emptySlotsToRender)].map((_, index) => (
                            <div key={`ghost-${index}`} className="flex-1 relative w-full min-h-0 pointer-events-none">
                                <div
                                    className="absolute inset-0 rounded-[var(--radius-sm)] border border-dashed flex items-center justify-center"
                                    style={{
                                        borderColor: 'var(--text-muted)',
                                        opacity: isPastDay ? 0.06 : 0.1
                                    }}
                                >
                                    <Plus size={14} className="opacity-30" style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                        ))}
                    </>
                )
            }

        </div >
    );
});
