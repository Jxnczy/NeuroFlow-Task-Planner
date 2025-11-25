import React from 'react';
import { Task, GridRow } from '../../../types';
import { getWeekDays, formatDate, TARGET_HOURS_PER_DAY, ROW_CONFIG, DAYS } from '../../../constants';
import { TaskCard } from '@/components/TaskCard';
import { GridCell } from './GridCell';

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
}

export const WeekView: React.FC<WeekViewProps> = ({
    tasks,
    currentDate,
    isStacked,
    onDropOnGrid,
    onDragStart,
    onToggleTaskComplete,
    onUpdateTask,
    onDeleteTask,
    onTaskDrop
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const todayStr = formatDate(new Date());
    const ROW_LABELS: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];

    const renderWeekStacked = () => (
        <div className="flex-grow flex relative mt-0 overflow-y-auto no-scrollbar gap-2">
            {currentWeekDays.map((day, i) => {
                const dayTasks = tasks.filter(t => t.status !== 'unscheduled' && t.dueDate === formatDate(day));
                const isToday = formatDate(day) === todayStr;

                return (
                    <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOnGrid(e, day, null)}
                        className={`
                            flex-1 w-0 flex flex-col p-1.5 border-r last:border-none rounded-xl gap-2
                            ${isToday
                                ? 'bg-cyan-500/[0.04] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.05)]'
                                : 'border-white/[0.08]'
                            }
                        `}
                    >
                        {dayTasks
                            .sort((a, b) => {
                                const rowOrder: Record<string, number> = { 'GOAL': 0, 'FOCUS': 1, 'WORK': 2, 'LEISURE': 3, 'CHORES': 4 };
                                const aVal = rowOrder[a.assignedRow || ''] ?? 99;
                                const bVal = rowOrder[b.assignedRow || ''] ?? 99;
                                const indexA = tasks.findIndex(t => t.id === a.id);
                                const indexB = tasks.findIndex(t => t.id === b.id);
                                return (aVal - bVal) || (indexA - indexB);
                            })
                            .map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    variant="board" // Always board variant for grid
                                    onDragStart={onDragStart}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onToggleComplete={onToggleTaskComplete}
                                    onTaskDrop={onTaskDrop}
                                />
                            ))}
                    </div>
                );
            })}
        </div>
    );

    const renderWeekMatrix = () => (
        <div className="flex-grow flex flex-col relative mt-0 overflow-y-auto no-scrollbar pr-1">
            <div className="absolute top-0 left-2 text-[8px] font-bold text-slate-600 tracking-widest uppercase transform -translate-y-full mb-1">Mode</div>
            {ROW_LABELS.map(row => {
                const rowConfig = ROW_CONFIG[row];
                const style = rowConfig;
                return (
                    <div key={row} className={`${style.flexClass} shrink-0 flex border-b border-white/[0.08] last:border-b-0 group/row hover:bg-white/[0.02] transition-colors`}>
                        {/* Enhanced Label Column - Reduced width */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center relative py-2 border-r border-white/[0.08]">
                            <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${style.barColor} opacity-60 group-hover/row:opacity-100 transition-opacity`}></div>
                            <rowConfig.icon size={14} className={`mb-1 ${style.color}`} />
                            <div className={`text-[8px] font-bold tracking-widest uppercase ${style.color} mb-0.5 scale-90`}>{rowConfig.label}</div>
                        </div>

                        {/* Columns */}
                        {currentWeekDays.map((day, i) => {
                            const dayTasks = tasks.filter(t => t.dueDate === formatDate(day) && t.status !== 'unscheduled');
                            const isDayEmpty = dayTasks.length === 0; // Determine if the day has no scheduled tasks
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
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col h-full font-sans text-slate-300 overflow-hidden">
            {/* Grid Body */}
            <div className="flex-grow flex flex-col px-4 pb-4 overflow-hidden relative">
                {/* Days Header - Significantly Scaled Up */}
                <div className={`flex ${isStacked ? 'pl-0' : 'pl-16'} pb-0 shrink-0 transition-all duration-300 pt-1 gap-0`}>
                    {currentWeekDays.map((day, i) => {
                        const isToday = formatDate(day) === todayStr;
                        const dayTasks = tasks.filter(t => t.dueDate === formatDate(day) && t.status !== 'unscheduled');
                        const totalMinutes = dayTasks.reduce((acc, t) => acc + t.duration, 0);

                        // Capacity Logic
                        const targetMinutesPerDay = TARGET_HOURS_PER_DAY * 60;
                        const percentage = Math.min(100, (totalMinutes / targetMinutesPerDay) * 100);

                        // Format planned hours/minutes
                        const plannedHours = totalMinutes / 60;
                        let plannedDurationText: string;
                        if (totalMinutes === 0) {
                            plannedDurationText = '0h planned';
                        } else if (plannedHours < 1) {
                            plannedDurationText = `${totalMinutes}m`;
                        } else {
                            plannedDurationText = `${plannedHours.toFixed(1).replace(/\.0$/, '')}h`;
                        }

                        // Color Logic for text and bar fill - Simplified per spec for "Quiet Grid"
                        const statTextColor = 'text-slate-500/80';
                        const barFillColor = 'bg-cyan-500/80'; // Always category-neutral color
                        const dayHeaderCaption = totalMinutes === 0 ? 'Free day' : '';

                        return (
                            <div key={i} className="flex-1 w-0 text-center relative group px-1">
                                <div className={`
                        flex flex-col items-center py-2 px-1 rounded-xl transition-all relative 
                        ${isToday
                                        ? 'bg-gradient-to-b from-[#1e293b] to-transparent border-t border-cyan-500/30 text-cyan-50 shadow-[0_-5px_20px_rgba(6,182,212,0.1)] z-10'
                                        : 'border-transparent'
                                    }
                    `}>
                                    {/* Enlarged Day Name - Adjusted contrast */}
                                    <span className={`text-xs font-black uppercase tracking-widest opacity-80 mb-0 ${isToday ? 'text-cyan-400' : 'text-slate-400'}`}>{DAYS[i]}</span>

                                    {/* Massive Date Number - Scaled to 4xl */}
                                    <span className={`text-4xl font-display font-black leading-none ${isToday ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-slate-400'}`}>{day.getDate()}</span>

                                    {/* Optional "Free day" caption */}
                                    {dayHeaderCaption && (
                                        <span className="text-[10px] text-slate-600/70">{dayHeaderCaption}</span>
                                    )}

                                    {/* Ultra-thin Capacity Bar + Capacity Text */}
                                    <div className="w-full mt-2 flex flex-col items-center">
                                        {/* Bar Track */}
                                        <div className="w-full h-1 relative rounded-full bg-slate-800/30 overflow-hidden">
                                            {/* Bar Fill */}
                                            <div
                                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${barFillColor} rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>

                                        {/* Text Overlay - Small, muted capacity text */}
                                        <div className={`mt-1 font-medium ${statTextColor} transition-colors ${dayTasks.length > 0 ? 'text-xs' : 'text-[10px]'}`}>
                                            {dayTasks.length} tasks · {plannedDurationText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rows */}
                {isStacked ? renderWeekStacked() : renderWeekMatrix()}
            </div>
        </div>
    );
};
