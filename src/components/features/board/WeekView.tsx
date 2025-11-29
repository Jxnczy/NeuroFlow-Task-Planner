import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, GridRow } from '../../../types';
import { getWeekDays, formatDate, TARGET_HOURS_PER_DAY, ROW_CONFIG, DAYS, getAdjustedDate } from '../../../constants';
import { TaskCard } from '@/components/TaskCard';
import { GridCell } from './GridCell';
import { CheckCircle2 } from 'lucide-react';

interface WeekViewProps {
    tasks: Task[];
    currentDate: Date;
    isStacked: boolean;
    onDropOnGrid: (e: React.DragEvent, day: Date, row: GridRow | null) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onToggleTaskComplete: (taskId: string) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    onTaskDrop?: (sourceId: string, targetId: string) => void;
    showCompleted: boolean;
    showCompleted: boolean;
}

// Progress color: 0% = Red (nothing done), 100% = Green (all done)
const getGradientColor = (percent: number): string => {
    const p = Math.max(0, Math.min(100, percent));

    // Red (0%) -> Yellow (50%) -> Green (100%)
    if (p <= 50) {
        // Red to Yellow: (239, 68, 68) to (250, 204, 21)
        const r = Math.round(239 + (250 - 239) * (p / 50));
        const g = Math.round(68 + (204 - 68) * (p / 50));
        const b = Math.round(68 + (21 - 68) * (p / 50));
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Yellow to Green: (250, 204, 21) to (34, 197, 94)
        const r = Math.round(250 + (34 - 250) * ((p - 50) / 50));
        const g = Math.round(204 + (197 - 204) * ((p - 50) / 50));
        const b = Math.round(21 + (94 - 21) * ((p - 50) / 50));
        return `rgb(${r}, ${g}, ${b})`;
    }
};

export const WeekView: React.FC<WeekViewProps> = ({
    tasks,
    currentDate,
    isStacked,
    onDropOnGrid,
    onDragStart,
    onToggleTaskComplete,
    onUpdateTask,
    onDeleteTask,
    onTaskDrop,
    showCompleted
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const todayStr = formatDate(getAdjustedDate());
    const ROW_LABELS: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];

    // Track which icon is hovered (not row)
    const [hoveredIcon, setHoveredIcon] = useState<GridRow | null>(null);

    const renderWeekStacked = () => (
        <div className="flex-grow flex relative mt-0 overflow-y-auto no-scrollbar gap-2">
            {currentWeekDays.map((day, i) => {
                // Get all tasks for the day (including completed)
                const allDayTasks = tasks.filter(t =>
                    t.status !== 'unscheduled' &&
                    t.dueDate === formatDate(day)
                );

                // Get only incomplete tasks for display (exclude rescheduled from main list)
                const activeTasks = allDayTasks.filter(t => t.status !== 'completed' && t.status !== 'rescheduled');
                const rescheduledTasks = allDayTasks.filter(t => t.status === 'rescheduled');

                const dayStr = formatDate(day);
                const isToday = dayStr === todayStr;
                const isPastDay = dayStr < todayStr;
                const hasTasksScheduled = allDayTasks.length > 0;
                const allTasksCompleted = hasTasksScheduled && allDayTasks.every(t => t.status === 'completed');

                return (
                    <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOnGrid(e, day, null)}
                        className="flex-1 w-0 flex flex-col p-2 rounded-2xl gap-2 transition-all duration-300"
                        style={{
                            backgroundColor: isToday ? 'color-mix(in srgb, var(--accent) 2%, transparent)' : 'transparent',
                            border: isToday ? '1px solid' : (isPastDay ? '1px solid color-mix(in srgb, var(--border-light), transparent 35%)' : '1px solid transparent'),
                            borderColor: isToday ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent'
                        }}
                    >
                        {allTasksCompleted ? (
                            <div
                                className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-8 animate-in fade-in zoom-in-95 duration-500"
                                style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                    borderStyle: 'dashed',
                                    opacity: isPastDay ? 0.65 : 1
                                }}
                            >
                                <CheckCircle2
                                    size={48}
                                    style={{
                                        color: '#10b981',
                                        filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))'
                                    }}
                                />
                                <div className="text-center">
                                    <div
                                        className="text-sm font-bold"
                                        style={{ color: '#10b981' }}
                                    >
                                        Finished all tasks
                                    </div>
                                    <div
                                        className="text-[10px] mt-1 opacity-60"
                                        style={{ color: '#10b981' }}
                                    >
                                        {allDayTasks.length} task{allDayTasks.length !== 1 ? 's' : ''} completed
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {activeTasks
                                    .sort((a, b) => {
                                        const rowOrder: Record<string, number> = { 'GOAL': 0, 'FOCUS': 1, 'WORK': 2, 'LEISURE': 3, 'CHORES': 4 };
                                        const aVal = rowOrder[a.assignedRow || ''] ?? 99;
                                        const bVal = rowOrder[b.assignedRow || ''] ?? 99;
                                        const indexA = tasks.findIndex(t => t.id === a.id);
                                        const indexB = tasks.findIndex(t => t.id === b.id);
                                        return (aVal - bVal) || (indexA - indexB);
                                    })
                                    .map((task, idx) => (
                                        <div
                                            key={task.id}
                                            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                                            style={{ animationDelay: `${idx * 30}ms` }}
                                        >
                                            <TaskCard
                                                task={task}
                                                variant="board"
                                                onDragStart={onDragStart}
                                                onUpdateTask={onUpdateTask}
                                                onDeleteTask={onDeleteTask}
                                                onToggleComplete={onToggleTaskComplete}
                                                onTaskDrop={onTaskDrop}
                                                isOverdue={isPastDay}
                                            />
                                        </div>
                                    ))}


                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderWeekMatrix = () => (
        <div className="flex-grow flex flex-col relative mt-0 overflow-y-auto no-scrollbar pr-1">
            {ROW_LABELS.map(row => {
                const rowConfig = ROW_CONFIG[row];
                const style = rowConfig;
                const isIconHovered = hoveredIcon === row;

                return (
                    <div
                        key={row}
                        className={`${style.flexClass} shrink-0 flex border-b last:border-b-0 group/row transition-all duration-200`}
                        style={{
                            borderColor: 'var(--border-light)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        {/* Row Label - Tooltip only on icon hover */}
                        <div
                            className="w-20 shrink-0 flex flex-col items-center justify-center relative py-3 border-r cursor-default"
                            style={{ borderColor: 'var(--border-light)' }}
                        >
                            <div
                                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${style.barColor} transition-all duration-300`}
                                style={{ opacity: 0.6 }}
                            />

                            {/* Icon with hover for tooltip */}
                            <div
                                className="relative"
                                onMouseEnter={() => setHoveredIcon(row)}
                                onMouseLeave={() => setHoveredIcon(null)}
                            >
                                <rowConfig.icon
                                    size={20}
                                    className={`mb-1.5 ${style.color} transition-all duration-200 cursor-help`}
                                    style={{ transform: isIconHovered ? 'scale(1.2)' : 'scale(1)' }}
                                />

                                {/* Tooltip - only shows when icon is hovered */}
                                {isIconHovered && (
                                    <div
                                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-xl text-[10px] whitespace-nowrap shadow-2xl border animate-in fade-in slide-in-from-left-2 duration-150"
                                        style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderColor: 'var(--border-medium)',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        <div className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{rowConfig.label}</div>
                                        {rowConfig.description}
                                    </div>
                                )}
                            </div>

                            <div className={`text-[10px] font-black tracking-widest uppercase ${style.color}`}>
                                {rowConfig.label}
                            </div>

                            <div
                                className="text-[8px] font-medium mt-0.5"
                                style={{
                                    color: 'var(--text-muted)',
                                    opacity: 0.5
                                }}
                            >
                                {rowConfig.sub}
                            </div>
                        </div>

                        {/* Columns */}
                        {currentWeekDays.map((day, i) => {
                            const dayTasks = tasks.filter(t => {
                                if (t.status === 'unscheduled') return false;
                                if (t.dueDate !== formatDate(day)) return false;
                                return true;
                            });
                            const isDayEmpty = dayTasks.length === 0;
                            const isPastDay = formatDate(day) < todayStr;
                            return (
                                <GridCell
                                    key={`${i}-${row}`}
                                    day={day}
                                    row={row}
                                    isToday={formatDate(day) === todayStr}
                                    tasks={tasks}
                                    onDrop={onDropOnGrid}
                                    onDragStart={onDragStart}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onToggleComplete={onToggleTaskComplete}
                                    isDayEmpty={isDayEmpty}
                                    onTaskDrop={onTaskDrop}
                                    showCompleted={showCompleted}
                                    isPastDay={isPastDay}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col h-full font-sans overflow-hidden" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex-grow flex flex-col px-4 pb-4 overflow-hidden relative">
                {/* Days Header */}
                <div className={`flex ${isStacked ? 'pl-0' : 'pl-20'} pb-0 shrink-0 transition-all duration-300 pt-1 gap-0`}>
                    {currentWeekDays.map((day, i) => {
                        const isToday = formatDate(day) === todayStr;
                        const dateStr = formatDate(day);

                        // Calculate stats from live tasks (including rescheduled for denominator)
                        const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== 'unscheduled');
                        const completedTasks = dayTasks.filter(t => t.status === 'completed');

                        const totalMinutes = dayTasks.reduce((acc, t) => acc + t.duration, 0);
                        const completedMinutes = completedTasks.reduce((acc, t) => acc + t.duration, 0);
                        const targetMinutesPerDay = TARGET_HOURS_PER_DAY * 60;

                        const plannedPercent = Math.min(100, (totalMinutes / targetMinutesPerDay) * 100);

                        // Completion Rate: Completed / (Completed + Remaining + Rescheduled)
                        const completionPercent = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

                        const plannedHours = (totalMinutes / 60).toFixed(1).replace(/\.0$/, '');
                        const completionColor = getGradientColor(completionPercent);

                        const isOverCapacity = plannedPercent > 100;
                        const isNearCapacity = plannedPercent > 80;

                        // Check if day is in the past (strictly before today)
                        const todayDate = new Date(todayStr);
                        const currentDayDate = new Date(formatDate(day));
                        const isPastDay = currentDayDate < todayDate;

                        // Apply subtle styling for past completed days
                        const isSubtle = isPastDay;

                        return (
                            <div key={i} className="flex-1 w-0 text-center relative group px-1">
                                <div
                                    className="flex flex-col items-center py-3 px-2 rounded-2xl transition-all duration-300 relative"
                                    style={{
                                        background: isToday
                                            ? `linear-gradient(to bottom, color-mix(in srgb, var(--accent) 3%, transparent), transparent)`
                                            : 'transparent',
                                        borderTop: isToday ? '2px solid' : 'none',
                                        borderColor: isToday ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'transparent',
                                        zIndex: isToday ? 10 : 'auto',
                                        opacity: isPastDay ? 0.65 : 1
                                    }}
                                >
                                    {/* Day Name */}
                                    <span
                                        className="text-[11px] font-black uppercase tracking-widest mb-0.5"
                                        style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)', opacity: isToday ? 1 : 0.6 }}
                                    >
                                        {DAYS[i]}
                                    </span>

                                    {/* Date Number */}
                                    <span
                                        className="text-4xl font-display font-black leading-none transition-all duration-300"
                                        style={{
                                            color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                                            textShadow: isToday ? '0 0 20px rgba(255,255,255,0.2)' : 'none',
                                            opacity: isToday ? 1 : 0.5
                                        }}
                                    >
                                        {day.getDate()}
                                    </span>

                                    {/* Workload Indicator */}
                                    <div className="w-full mt-3 flex flex-col items-center gap-1.5">
                                        <div
                                            className="text-xs font-extrabold transition-colors"
                                            style={{
                                                color: isOverCapacity
                                                    ? 'var(--error)'
                                                    : isNearCapacity
                                                        ? 'var(--warning)'
                                                        : 'var(--text-muted)',
                                                opacity: totalMinutes > 0 ? 1 : 0.4
                                            }}
                                        >
                                            {totalMinutes > 0 ? `${plannedHours}h / ${TARGET_HOURS_PER_DAY}h` : '—'}
                                        </div>

                                        {totalMinutes > 0 && (
                                            <div className="w-full flex flex-col items-center gap-1">
                                                <div
                                                    className="w-full h-2 rounded-full overflow-hidden relative"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                >
                                                    <motion.div
                                                        className="absolute left-0 top-0 bottom-0 rounded-full"
                                                        initial={false}
                                                        animate={{
                                                            width: `${completionPercent}%`,
                                                            backgroundColor: completionColor,
                                                            opacity: isSubtle ? 0.4 : 1,
                                                            boxShadow: (completionPercent > 0 && !isSubtle) ? `0 0 10px ${completionColor}50` : 'none'
                                                        }}
                                                        transition={{ type: "spring", stiffness: 40, damping: 15 }}
                                                    />
                                                </div>

                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ opacity: isSubtle ? 0.4 : 1 }}
                                                >
                                                    {completionPercent >= 100 && (
                                                        <CheckCircle2 size={12} style={{ color: completionColor }} />
                                                    )}
                                                    <span
                                                        className="text-[11px] font-extrabold"
                                                        style={{ color: completionColor }}
                                                    >
                                                        {completionPercent}% done
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rows */}
                {isStacked ? renderWeekStacked() : renderWeekMatrix()}
            </div >
        </div >
    );
};
