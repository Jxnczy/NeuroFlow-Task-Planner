import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, GridRow } from '../../../types';
import { formatDate } from '../../../constants';
import { BoardTaskCard } from '../../tasks/BoardTaskCard';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { weekSwitch } from '../../../utils/animations';

interface WeekStackedViewProps {
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
    onSelectTask?: (taskId: string) => void;
}

export const WeekStackedView: React.FC<WeekStackedViewProps> = ({
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
    onTaskDrop,
    onSelectTask
}) => {
    return (
        <motion.div
            key={weekKey}
            variants={weekSwitch(weekDirection)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-grow flex relative mt-0 overflow-y-auto no-scrollbar gap-2"
        >
            {currentWeekDays.map((day, i) => {
                // Get all tasks for the day (including completed)
                const allDayTasks = tasks.filter(t =>
                    t.status !== 'unscheduled' &&
                    t.dueDate === formatDate(day)
                );

                // Filter tasks based on viewMode
                const activeTasks = allDayTasks.filter(t => {
                    if (t.status === 'rescheduled') return false;
                    if (t.status === 'completed') {
                        return viewMode !== 'hide';
                    }
                    return true;
                });

                const rescheduledTasks = allDayTasks.filter(t => t.status === 'rescheduled');

                const dayStr = formatDate(day);
                const isToday = dayStr === todayStr;
                const isPastDay = dayStr < todayStr;
                const hasTasksScheduled = allDayTasks.length > 0;
                const allTasksCompleted = hasTasksScheduled && allDayTasks.every(t => t.status === 'completed');

                return (
                    <div
                        key={i}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => onDropOnGrid(e, day, null)}
                        className="flex-1 w-0 flex flex-col p-2 rounded-2xl gap-2 transition-all duration-300"
                        style={{
                            backgroundColor: 'transparent',
                            border: isToday ? '1px solid' : (isPastDay ? '1px solid color-mix(in srgb, var(--border-light), transparent 35%)' : '1px solid transparent'),
                            borderColor: isToday ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent'
                        }}
                    >
                        {allTasksCompleted && viewMode !== 'hide' ? (
                            <div
                                className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-8 animate-in fade-in zoom-in-95 duration-500"
                                style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
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
                                <AnimatePresence mode="popLayout">
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
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <BoardTaskCard
                                                    task={task}
                                                    onDragStart={onDragStart}
                                                    onDragEnd={onDragEnd}
                                                    onUpdateTask={onUpdateTask}
                                                    onDeleteTask={onDeleteTask}
                                                    onToggleComplete={onToggleTaskComplete}
                                                    viewMode={viewMode}
                                                    onSelectTask={onSelectTask}
                                                />
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                );
            })}
        </motion.div>
    );
};
