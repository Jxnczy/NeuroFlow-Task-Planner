import React from 'react';
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
}

export const GridCell: React.FC<GridCellProps> = ({ day, row, isToday, tasks, onDrop, onDragStart, onToggleComplete, onUpdateTask, onDeleteTask, isDayEmpty, onTaskDrop }) => {
    const dayStr = formatDate(day);
    const cellTasks = tasks.filter(t => t.status !== 'unscheduled' && t.dueDate === dayStr && t.assignedRow === row);

    // Define visual slots per category
    const slotCount = row === 'GOAL' ? 1 : 3;

    // Render tasks up to the slotCount
    const visibleTasks = cellTasks.slice(0, slotCount);
    const emptySlotsToRender = slotCount - visibleTasks.length;

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, day, row)}
            title={`${ROW_CONFIG[row].label}: ${ROW_CONFIG[row].description}`}
            className="relative flex-1 w-0 transition-all duration-300 group/cell hover:bg-white/[0.015] flex flex-col p-1.5 gap-1.5"
            style={{
                borderLeft: isToday ? '1px solid' : 'none',
                borderRight: '1px solid',
                borderColor: isToday ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--border-light)',
                backgroundColor: isToday ? 'var(--accent-muted)' : 'transparent'
            }}
        >
            {/* Render actual tasks */}
            {visibleTasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    variant="board"
                    onDragStart={onDragStart}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                    onTaskDrop={onTaskDrop}
                />
            ))}

            {/* Render ghost slots - nearly invisible until cell hover */}
            {emptySlotsToRender > 0 && Array.from({ length: emptySlotsToRender }).map((_, index) => (
                <div
                    key={`ghost-${index}`}
                    className={`
                        flex-1 relative w-full group/slot min-h-0
                        ${row === 'GOAL' ? 'min-h-[4rem]' : 'min-h-[2.5rem]'}
                    `}
                >
                    {/* Ghost slot - only visible on cell hover */}
                    <div 
                        className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-all duration-300"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <Plus 
                            size={14} 
                            className="opacity-0 group-hover/slot:opacity-60 transition-opacity duration-200" 
                            style={{ color: 'var(--text-muted)' }} 
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
