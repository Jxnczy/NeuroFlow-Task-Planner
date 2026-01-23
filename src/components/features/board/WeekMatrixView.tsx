import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, GridRow } from '../../../types';
import { ROW_CONFIG, formatDate } from '../../../constants';
import { GridCell } from './GridCell';
import { weekSwitch } from '../../../utils/animations';

interface WeekMatrixViewProps {
    weekKey: string;
    weekDirection: 'next' | 'prev';
    currentWeekDays: Date[];
    tasks: Task[];
    todayStr: string;
    viewMode: 'show' | 'fade' | 'hide';
    onDropOnGrid: (e: React.DragEvent, day: Date, row: GridRow | null) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask?: (taskId: string) => void;
    onToggleTaskComplete: (taskId: string) => void;
    onTaskDrop?: (sourceId: string, targetId: string) => void;
}

export const WeekMatrixView: React.FC<WeekMatrixViewProps> = ({
    weekKey,
    weekDirection,
    currentWeekDays,
    tasks,
    todayStr,
    viewMode,
    onDropOnGrid,
    onDragStart,
    onDragEnd,
    onUpdateTask,
    onDeleteTask,
    onToggleTaskComplete,
    onTaskDrop
}) => {
    const [hoveredIcon, setHoveredIcon] = useState<GridRow | null>(null);
    const ROW_LABELS: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];

    return (
        <motion.div
            key={weekKey}
            variants={weekSwitch(weekDirection)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-grow flex flex-col relative mt-0 overflow-y-auto no-scrollbar pr-1"
        >
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
                            className="shrink-0 flex flex-col items-center justify-center relative py-3 border-r cursor-default"
                            style={{ borderColor: 'var(--border-light)', width: 'var(--row-label-width, 80px)' }}
                        >
                            <div
                                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${style.barColor} transition-all duration-300`}
                                style={{ opacity: 0.55 }}
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
                                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-[var(--radius-md)] text-[10px] whitespace-nowrap border animate-in fade-in slide-in-from-left-2 duration-150"
                                    style={{
                                        backgroundColor: 'var(--surface)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-secondary)',
                                        boxShadow: 'var(--shadow-md)'
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
                                className="text-[10px] font-bold mt-0.5"
                                style={{
                                    color: 'var(--text-secondary)',
                                    opacity: 0.9
                                }}
                            >
                                {rowConfig.sub}
                            </div>
                        </div>

                        {/* Columns */}
                        <div className="flex-1 flex gap-2 min-w-0">
                            {currentWeekDays.map((day, i) => {
                                const dayTasks = (tasks || []).filter(t => {
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
                                        tasks={tasks || []}
                                        onDrop={onDropOnGrid}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                        onUpdateTask={onUpdateTask}
                                        onDeleteTask={onDeleteTask}
                                        onToggleComplete={onToggleTaskComplete}
                                        isDayEmpty={isDayEmpty}
                                        onTaskDrop={onTaskDrop}
                                        viewMode={viewMode}
                                        isPastDay={isPastDay}
                                        isFirstColumn={i === 0}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};
