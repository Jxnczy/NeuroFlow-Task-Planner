import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, GridRow } from '../../../types';
import { formatDate, ROW_CONFIG } from '../../../constants';
import { TaskCard } from '@/components/TaskCard';

interface GridCellProps {
    day: Date;
    row: GridRow;
    isToday: boolean;
    tasks: Task[];
    onDrop: (e: React.DragEvent, day: Date, row: GridRow) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onToggleComplete: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    isDayEmpty: boolean;
    onTaskDrop?: (sourceId: string, targetId: string) => void;
    showCompleted: boolean;
}

export const GridCell: React.FC<GridCellProps> = ({
    day,
    row,
    isToday,
    tasks,
    onDrop,
    onDragStart,
    onToggleComplete,
    onUpdateTask,
    onDeleteTask,
    isDayEmpty,
    onTaskDrop,
    showCompleted
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const dayStr = formatDate(day);
    const cellTasks = tasks.filter(t => t.status !== 'unscheduled' && t.dueDate === dayStr && t.assignedRow === row);

    const slotCount = row === 'GOAL' ? 1 : 3;
    const visibleTasks = cellTasks.slice(0, slotCount);
    const emptySlotsToRender = slotCount - visibleTasks.length;

    // Only set drag over on the actual cell element, not children
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        // Only respond if entering the cell itself
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(true);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
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
            className="relative flex-1 w-0 flex flex-col p-1.5 gap-1 transition-colors duration-150"
            style={{
                borderRight: '1px solid var(--border-light)',
                backgroundColor: isDragOver
                    ? 'var(--accent-muted)'
                    : isToday
                        ? 'color-mix(in srgb, var(--accent) 3%, transparent)'
                        : 'transparent'
            }}
        >
            {/* Tasks */}
            {visibleTasks.map((task) => (
                <div
                    key={task.id}
                    className="flex-1 min-h-0"
                    style={{
                        opacity: !showCompleted && task.status === 'completed' ? 0.15 : 1,
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <TaskCard
                        task={task}
                        variant="board"
                        onDragStart={onDragStart}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onToggleComplete={onToggleComplete}
                        onTaskDrop={onTaskDrop}
                    />
                </div>
            ))}

            {/* Drop Indicator - Fills remaining space */}
            {isDragOver && emptySlotsToRender > 0 && (
                <div
                    className={`relative w-full min-h-0 border-2 border-dashed rounded-lg pointer-events-none z-20 flex items-center justify-center animate-in fade-in duration-200 ${ROW_CONFIG[row].barColor.replace('bg-', 'border-')}`}
                    style={{
                        flex: emptySlotsToRender,
                        backgroundColor: 'rgba(255,255,255,0.03)'
                    }}
                >
                    <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ROW_CONFIG[row].barColor} text-white`}
                    >
                        Drop
                    </span>
                </div>
            )}

            {/* Empty slots - only show if NOT dragging over (or if we want them to show underneath? No, usually hide them or replace them) */}
            {/* Logic: If dragging over, we show the big drop zone instead of individual ghost slots. */}
            {emptySlotsToRender > 0 && !isDragOver && Array.from({ length: emptySlotsToRender }).map((_, index) => (
                <div key={`ghost-${index}`} className="flex-1 relative w-full min-h-0 pointer-events-none">
                    <div
                        className="absolute inset-0 rounded-lg border border-dashed opacity-10 flex items-center justify-center"
                        style={{ borderColor: 'var(--text-muted)' }}
                    >
                        <Plus size={14} className="opacity-30" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};
