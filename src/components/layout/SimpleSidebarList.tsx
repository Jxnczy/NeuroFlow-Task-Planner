import React from 'react';
import { Task, TaskType, GridRow } from '../../types';
import { CATEGORIES } from '../../constants';
import { SidebarTaskCard } from '../tasks/SidebarTaskCard';
import { ChevronDown } from 'lucide-react';

interface SimpleSidebarListProps {
    tasks: Task[];
    expandedCategories: Record<string, boolean>;
    toggleCategory: (catId: string) => void;
    dragOverCategory: string | null;
    onCategoryDragEnter: (e: React.DragEvent, catId: string) => void;
    onCategoryDragLeave: (e: React.DragEvent, catId: string) => void;
    onCategoryDrop: (e: React.DragEvent, catId: string) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleComplete: (taskId: string) => void;
    onScheduleTask: (taskId: string, date: Date, row: GridRow | null, type?: TaskType) => void;
    isMobile: boolean;
    onCloseSidebar?: () => void;
    onLongPressTask?: (task: Task) => void;
}

export const SimpleSidebarList: React.FC<SimpleSidebarListProps> = ({
    tasks,
    expandedCategories,
    toggleCategory,
    dragOverCategory,
    onCategoryDragEnter,
    onCategoryDragLeave,
    onCategoryDrop,
    onDragStart,
    onDragEnd,
    onUpdateTask,
    onDeleteTask,
    onToggleComplete,
    onScheduleTask,
    isMobile,
    onCloseSidebar,
    onLongPressTask
}) => {
    return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto scrollbar-hide">
            {CATEGORIES.map((cat, index) => {
                const catTasks = tasks.filter(t => t.type === cat.id && t.status === 'unscheduled' && !t.isFrozen);
                const isExpanded = expandedCategories[cat.id];
                const isDraggedOver = dragOverCategory === cat.id;

                return (
                    <div key={cat.id} className="px-3">
                        {/* Category Header */}
                        <div
                            className={`border-t border-zinc-800/40 pt-3 pb-1 flex items-center justify-between group ${index === 0 ? 'border-t-0 pt-0' : ''}`}
                            onDragEnter={(e) => onCategoryDragEnter(e, cat.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => onCategoryDragLeave(e, cat.id)}
                            onDrop={(e) => onCategoryDrop(e, cat.id)}
                            style={isDraggedOver ? {
                                backgroundColor: `${cat.color}15`,
                                borderRadius: '8px'
                            } : undefined}
                        >
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="flex-1 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: cat.color, color: cat.color }} />
                                    <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                        {cat.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono">
                                        {catTasks.length}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className="transition-transform text-zinc-600 group-hover:text-zinc-400"
                                        style={{
                                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                                        }}
                                    />
                                </div>
                            </button>
                        </div>

                        {/* Tasks */}
                        {isExpanded && (
                            <div className="space-y-2 pb-2">
                                {catTasks.map(task => (
                                    <SidebarTaskCard
                                        key={task.id}
                                        task={task}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                        onUpdateTask={onUpdateTask}
                                        onDeleteTask={onDeleteTask}
                                        onToggleComplete={onToggleComplete}
                                        onScheduleTask={onScheduleTask}
                                        isMobile={isMobile}
                                        onCloseSidebar={onCloseSidebar}
                                        onLongPress={onLongPressTask}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
