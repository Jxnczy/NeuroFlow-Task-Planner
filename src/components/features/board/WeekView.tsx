import React, { useState } from 'react';
import { Task, GridRow } from '../../../types';
import { getWeekDays, formatDate, TARGET_HOURS_PER_DAY, ROW_CONFIG, DAYS, getAdjustedDate } from '../../../constants';
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
    onTaskDrop,
    showCompleted
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const todayStr = formatDate(getAdjustedDate());
    const ROW_LABELS: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];
    
    // Track hovered row for showing description
    const [hoveredRow, setHoveredRow] = useState<GridRow | null>(null);

    const renderWeekStacked = () => (
        <div className="flex-grow flex relative mt-0 overflow-y-auto no-scrollbar gap-2">
            {currentWeekDays.map((day, i) => {
                const dayTasks = tasks.filter(t =>
                    t.status !== 'unscheduled' &&
                    t.dueDate === formatDate(day) &&
                    (showCompleted || t.status !== 'completed')
                );
                const isToday = formatDate(day) === todayStr;

                return (
                    <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOnGrid(e, day, null)}
                        className="flex-1 w-0 flex flex-col p-1.5 border-r last:border-none rounded-xl gap-2"
                        style={{
                            backgroundColor: isToday ? 'var(--accent-muted)' : 'transparent',
                            borderColor: isToday ? 'var(--accent)' : 'var(--border-medium)',
                            borderWidth: isToday ? '1px' : undefined,
                            boxShadow: isToday ? '0 0 30px var(--accent-muted)' : undefined
                        }}
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
                                    variant="board"
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
            {ROW_LABELS.map(row => {
                const rowConfig = ROW_CONFIG[row];
                const style = rowConfig;
                const isHovered = hoveredRow === row;
                
                return (
                    <div 
                        key={row} 
                        className={`${style.flexClass} shrink-0 flex border-b last:border-b-0 group/row hover:bg-white/[0.015] transition-colors`} 
                        style={{ borderColor: 'var(--border-light)' }}
                        onMouseEnter={() => setHoveredRow(row)}
                        onMouseLeave={() => setHoveredRow(null)}
                    >
                        {/* Enhanced Label Column - Wider & More Visible */}
                        <div 
                            className="w-20 shrink-0 flex flex-col items-center justify-center relative py-3 border-r cursor-default"
                            style={{ borderColor: 'var(--border-light)' }}
                        >
                            {/* Colored bar indicator */}
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${style.barColor} opacity-70 group-hover/row:opacity-100 transition-opacity`}></div>
                            
                            {/* Icon - Bigger */}
                            <rowConfig.icon size={18} className={`mb-1.5 ${style.color} transition-transform group-hover/row:scale-110`} />
                            
                            {/* Label - Bigger & Bolder */}
                            <div className={`text-[10px] font-black tracking-widest uppercase ${style.color}`}>
                                {rowConfig.label}
                            </div>
                            
                            {/* Subtitle - Shows on hover */}
                            <div 
                                className="text-[8px] font-medium mt-0.5 transition-opacity duration-200"
                                style={{ 
                                    color: 'var(--text-muted)',
                                    opacity: isHovered ? 0.8 : 0.4
                                }}
                            >
                                {rowConfig.sub}
                            </div>
                            
                            {/* Description tooltip on hover */}
                            {isHovered && (
                                <div 
                                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap shadow-xl border animate-in fade-in slide-in-from-left-1 duration-150"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-medium)',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {rowConfig.description}
                                </div>
                            )}
                        </div>

                        {/* Columns */}
                        {currentWeekDays.map((day, i) => {
                            const dayTasks = tasks.filter(t => {
                                if (t.status === 'unscheduled') return false;
                                if (t.dueDate !== formatDate(day)) return false;
                                if (!showCompleted && t.status === 'completed') return false;
                                return true;
                            });
                            const isDayEmpty = dayTasks.length === 0;
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
        <div className="flex flex-col h-full font-sans overflow-hidden" style={{ color: 'var(--text-secondary)' }}>
            {/* Grid Body */}
            <div className="flex-grow flex flex-col px-4 pb-4 overflow-hidden relative">
                {/* Days Header */}
                <div className={`flex ${isStacked ? 'pl-0' : 'pl-20'} pb-0 shrink-0 transition-all duration-300 pt-1 gap-0`}>
                    {currentWeekDays.map((day, i) => {
                        const isToday = formatDate(day) === todayStr;
                        const dayTasks = tasks.filter(t => t.dueDate === formatDate(day) && t.status !== 'unscheduled');
                        const totalMinutes = dayTasks.reduce((acc, t) => acc + t.duration, 0);

                        // Capacity Logic
                        const targetMinutesPerDay = TARGET_HOURS_PER_DAY * 60;
                        const percentage = Math.min(100, (totalMinutes / targetMinutesPerDay) * 100);

                        // Format: show "Xh / 6h" for clarity
                        const plannedHours = totalMinutes / 60;
                        const capacityText = `${plannedHours.toFixed(1).replace(/\.0$/, '')}h / ${TARGET_HOURS_PER_DAY}h`;
                        
                        // Capacity status color
                        const isOverCapacity = percentage > 100;
                        const isNearCapacity = percentage > 80;

                        return (
                            <div key={i} className="flex-1 w-0 text-center relative group px-1">
                                <div 
                                    className="flex flex-col items-center py-2 px-1 rounded-xl transition-all relative"
                                    style={{
                                        background: isToday 
                                            ? `linear-gradient(to bottom, var(--bg-tertiary), transparent)` 
                                            : 'transparent',
                                        borderTop: isToday ? '1px solid' : 'none',
                                        borderColor: isToday ? 'var(--accent)' : 'transparent',
                                        boxShadow: isToday ? '0 -5px 20px var(--accent-muted)' : 'none',
                                        zIndex: isToday ? 10 : 'auto'
                                    }}
                                >
                                    {/* Day Name */}
                                    <span 
                                        className="text-[11px] font-black uppercase tracking-widest mb-0"
                                        style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)', opacity: isToday ? 1 : 0.7 }}
                                    >
                                        {DAYS[i]}
                                    </span>

                                    {/* Date Number */}
                                    <span 
                                        className="text-4xl font-display font-black leading-none"
                                        style={{ 
                                            color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                                            textShadow: isToday ? '0 0 15px rgba(255,255,255,0.3)' : 'none',
                                            opacity: isToday ? 1 : 0.6
                                        }}
                                    >
                                        {day.getDate()}
                                    </span>

                                    {/* Capacity Bar + Text */}
                                    <div className="w-full mt-2 flex flex-col items-center">
                                        {/* Bar Track */}
                                        <div 
                                            className="w-full h-1 relative rounded-full overflow-hidden"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--text-muted) 15%, transparent)' }}
                                        >
                                            {/* Bar Fill */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out rounded-full"
                                                style={{ 
                                                    width: `${Math.min(100, percentage)}%`,
                                                    backgroundColor: isOverCapacity 
                                                        ? 'var(--error)' 
                                                        : isNearCapacity 
                                                            ? 'var(--warning)' 
                                                            : 'var(--accent)',
                                                    opacity: totalMinutes > 0 ? 0.85 : 0.3
                                                }}
                                            ></div>
                                        </div>

                                        {/* Capacity text: "Xh / 6h" format */}
                                        <div 
                                            className="mt-1 text-[10px] font-medium transition-colors"
                                            style={{ 
                                                color: isOverCapacity 
                                                    ? 'var(--error)' 
                                                    : isNearCapacity 
                                                        ? 'var(--warning)' 
                                                        : 'var(--text-muted)',
                                                opacity: totalMinutes > 0 ? 0.9 : 0.5
                                            }}
                                        >
                                            {totalMinutes > 0 ? capacityText : '—'}
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
