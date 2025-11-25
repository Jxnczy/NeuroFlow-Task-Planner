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
            className={`
        relative flex-1 w-0 transition-all duration-300 group/cell
        /* Active Day Column Effect */
        ${isToday
                    ? 'border-l border-r border-cyan-500/20 bg-cyan-500/[0.02]'
                    : 'border-r border-white/[0.05] last:border-r-0 bg-transparent'
                }
        hover:bg-white/[0.02]
        flex flex-col p-1 gap-1
      `}
        >
            {/* Render actual tasks */}
            {visibleTasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    variant="board" // Always board variant for grid
                    onDragStart={onDragStart}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                    onTaskDrop={onTaskDrop}
                />
            ))}

            {/* Render ghost slots if needed */}
            {emptySlotsToRender > 0 && Array.from({ length: emptySlotsToRender }).map((_, index) => (
                <div
                    key={`ghost-${index}`}
                    className={`
              flex-1 relative w-full group/slot min-h-0
              ${row === 'GOAL' ? 'min-h-[4rem]' : 'min-h-[3rem]'}
          `}>
                    <div className={`
                  absolute inset-0 rounded-lg border-2 border-dashed
                  border-slate-700/10 bg-transparent
                  group-hover/slot:border-slate-600/50 group-hover/slot:bg-slate-800/50
                  flex items-center justify-center transition-all duration-300
              `}>
                        <Plus size={16} className="text-slate-500/50 opacity-0 group-hover/slot:opacity-100 transition-opacity duration-300" />
                    </div>
                </div>
            ))}
        </div>
    );
};
