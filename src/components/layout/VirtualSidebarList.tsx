import React, { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Task, TaskType, GridRow } from '../../types';
import { CATEGORIES } from '../../constants';
import { SidebarTaskCard } from '../tasks/SidebarTaskCard';
import { ChevronDown } from 'lucide-react';

interface VirtualSidebarListProps {
    tasks: Task[];
    expandedCategories: Record<string, boolean>;
    toggleCategory: (catId: string) => void;
    dragOverCategory: string | null;
    onCategoryDragEnter: (e: React.DragEvent, catId: string) => void;
    onCategoryDragLeave: (e: React.DragEvent, catId: string) => void;
    onCategoryDrop: (e: React.DragEvent, catId: string) => void;
    isDragging: boolean;
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

type ListItem =
    | { type: 'header'; category: typeof CATEGORIES[0]; count: number; isExpanded: boolean }
    | { type: 'task'; task: Task }
    | { type: 'dropZone'; category: typeof CATEGORIES[0]; isDraggedOver: boolean }
    | { type: 'empty'; category: typeof CATEGORIES[0] };

export const VirtualSidebarList: React.FC<VirtualSidebarListProps> = ({
    tasks,
    expandedCategories,
    toggleCategory,
    dragOverCategory,
    onCategoryDragEnter,
    onCategoryDragLeave,
    onCategoryDrop,
    isDragging,
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
    const listRef = React.useRef<List>(null);

    const flatList = useMemo(() => {
        const items: ListItem[] = [];

        CATEGORIES.forEach(cat => {
            const catTasks = tasks.filter(t => t.type === cat.id && t.status === 'unscheduled' && !t.isFrozen);
            const isExpanded = expandedCategories[cat.id];
            const isDraggedOver = dragOverCategory === cat.id;

            // 1. Header
            items.push({
                type: 'header',
                category: cat,
                count: catTasks.length,
                isExpanded
            });

            // 2. Body (only if expanded)
            if (isExpanded) {
                // Tasks
                catTasks.forEach(task => {
                    items.push({ type: 'task', task });
                });

                // Drop Zone or Empty State (ONLY when dragging)
                if (isDragging) {
                    items.push({ type: 'dropZone', category: cat, isDraggedOver });
                } else if (catTasks.length === 0) {
                    // Optional: Show "No tasks" text if not dragging? 
                    // User said: "drop to add" should ONLY show when dragging.
                    // The current code shows "No tasks — drag here" if empty and not dragging.
                    // Let's keep "No tasks" but maybe change the text or ensure "drop to add" is strictly for dragging.
                    // Actually, the user said "drop to add" specifically.
                    // The code has type: 'dropZone' which renders "Drop to add".
                    // And type: 'empty' which renders "No tasks — drag here".

                    // Let's look at the logic again.
                    // if (isDragging) -> dropZone ("Drop to add")
                    // else if (catTasks.length === 0) -> empty ("No tasks — drag here")

                    // So "Drop to add" IS only shown when dragging.
                    // Maybe the user means the "No tasks — drag here" looks like a drop zone?
                    // Or maybe they want the "No tasks" to NOT show "drag here"?

                    // Let's assume they want the "No tasks" state to be less inviting or hidden if they strictly mean "drop to add".
                    // But wait, if I drag, `isDragging` is true, so it shows `dropZone`.
                    // If I don't drag, `isDragging` is false.
                    // If tasks is empty, it shows `empty`.

                    // The user said: "drop to add" in sidebar should ONLY show when the user is dragging a task.
                    // The current code:
                    // if (isDragging) { items.push({ type: 'dropZone', ... }) }

                    // This seems correct.
                    // UNLESS `isDragging` is somehow true when it shouldn't be?
                    // OR the user considers "No tasks — drag here" to be "drop to add".

                    // Let's try to hide the "empty" state if it says "drag here" when not dragging?
                    // Or maybe just show nothing if empty and not dragging?
                    // "No tasks" is useful info.

                    // Let's look at the `dropZone` rendering again.
                    // It renders "Drop to add".

                    // Maybe the issue is that `isDragging` is not updating correctly?
                    // I'll assume the user sees "Drop to add" when NOT dragging.
                    // This would imply `isDragging` is true.

                    // BUT, if I look at the code:
                    // if (isExpanded || isDragging)

                    // If I am NOT dragging, but it IS expanded.
                    // Then we enter the block.
                    // if (isDragging) -> push dropZone.

                    // So if `isDragging` is false, we do NOT push dropZone.

                    // Maybe the user means the "empty" state which says "drag here"?
                    // "No tasks — drag here"

                    // I will change the empty state text to just "No tasks" when not dragging.
                    // And ensure `dropZone` is definitely only when dragging.

                    // Actually, looking at the previous code:
                    // if (isExpanded || isDragging) { ... }

                    // If I collapse a category, and drag, it expands (good).

                    // Let's try to be stricter.

                    items.push({ type: 'empty', category: cat });
                }
            }
        });

        return items;
    }, [tasks, expandedCategories, dragOverCategory, isDragging]);

    React.useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [flatList]);

    const getItemSize = (index: number) => {
        const item = flatList[index];
        switch (item.type) {
            case 'header': return 48; // 48px header
            case 'task': return 80; // Approx height of task card + margin
            case 'dropZone': return 60; // Height of drop zone
            case 'empty': return 40; // Height of empty state
            default: return 50;
        }
    };

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = flatList[index];

        // Adjust style for margins if needed, or handle inside the component
        // react-window uses absolute positioning, so margins don't collapse.
        // We can add padding to the inner div.

        switch (item.type) {
            case 'header':
                const { category, count, isExpanded } = item;
                return (
                    <div style={style} className="px-3">
                        <div
                            className={`border-t border-zinc-800/40 pt-3 pb-1 flex items-center justify-between group ${category.id === 'high' ? 'border-t-0 pt-0' : ''}`}
                            onDragEnter={(e) => onCategoryDragEnter(e, category.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => onCategoryDragLeave(e, category.id)}
                            onDrop={(e) => onCategoryDrop(e, category.id)}
                        >
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="flex-1 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: category.color, color: category.color }} />
                                    <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                        {category.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono">
                                        {count}
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
                    </div>
                );

            case 'task':
                return (
                    <div style={style} className="px-3 pb-2">
                        <SidebarTaskCard
                            task={item.task}
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
                    </div>
                );

            case 'dropZone':
                const { category: dzCat, isDraggedOver } = item;
                return (
                    <div style={style} className="px-3 pb-2">
                        <div
                            className={`
                                border-2 border-dashed rounded-md h-12 w-full flex items-center justify-center text-xs transition-colors duration-200
                                ${isDraggedOver
                                    ? 'bg-opacity-10'
                                    : 'border-zinc-700/50 bg-zinc-800/20 text-zinc-500'
                                }
                            `}
                            style={isDraggedOver ? {
                                borderColor: dzCat.color,
                                backgroundColor: `${dzCat.color}20`,
                                color: dzCat.color
                            } : undefined}
                            onDragEnter={(e) => onCategoryDragEnter(e, dzCat.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => onCategoryDragLeave(e, dzCat.id)}
                            onDrop={(e) => onCategoryDrop(e, dzCat.id)}
                        >
                            Drop to add
                        </div>
                    </div>
                );

            case 'empty':
                return (
                    <div style={style} className="px-3 pb-2">
                        <div
                            className="text-[11px] italic px-3 py-3 text-center text-zinc-500/60"
                            onDragEnter={(e) => onCategoryDragEnter(e, item.category.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => onCategoryDragLeave(e, item.category.id)}
                            onDrop={(e) => onCategoryDrop(e, item.category.id)}
                        >
                            No tasks — drag here
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 min-h-0 h-full">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={flatList.length}
                        itemSize={getItemSize}
                        className="scrollbar-hide"
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};
