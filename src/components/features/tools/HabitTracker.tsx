import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Plus, CalendarClock, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Habit, Task, TaskType } from '../../../types';
import { DAYS, getAdjustedDate } from '../../../constants';
import { generateId } from '../../../utils/id';

interface HabitTrackerProps {
    habits: Habit[];
    toggleHabit: (habitId: string, dayIndex: number) => void;
    onDeleteHabit?: (habitId: string) => void;
    onAddHabit?: (name: string, goal: number) => void;
    onAddTask?: (title: string, duration: number, type: TaskType, id?: string, notes?: string, parent_id?: string) => Task;
    onScheduleTask?: (taskId: string, date: Date, row?: any, type?: TaskType) => void;
}

interface ScheduleModalProps {
    habitName: string;
    onClose: () => void;
    onGenericSchedule: (duration: number, priority: TaskType, date: Date, time?: string) => void;
}

const ScheduleHabitModal: React.FC<ScheduleModalProps> = ({ habitName, onClose, onGenericSchedule }) => {
    const [priority, setPriority] = useState<TaskType>('medium');
    const [duration, setDuration] = useState(30);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');
    const [showTime, setShowTime] = useState(false);

    const handleSubmit = () => {
        const selectedDate = new Date(date);
        onGenericSchedule(duration, priority, selectedDate, showTime ? time : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#202024]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalendarClock size={20} className="text-[var(--accent)]" />
                        Schedule Habit
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Habit</label>
                        <div className="text-white font-medium text-lg">{habitName}</div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['high', 'medium', 'low', 'leisure', 'chores', 'backlog'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold uppercase transition-all border ${priority === p
                                        ? 'bg-white/10 border-[var(--accent)] text-[var(--accent)]'
                                        : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Duration</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[15, 30, 45, 60].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setDuration(m)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${duration === m
                                        ? 'bg-white/10 border-[var(--accent)] text-white'
                                        : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                                        }`}
                                >
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#202024] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent)] transition-colors appearance-none"
                            />
                            <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Time (Optional) */}
                    <div>
                        <button
                            onClick={() => setShowTime(!showTime)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-[var(--accent)] transition-colors"
                        >
                            <Clock size={14} />
                            Schedule Time (Optional)
                            <span className={`transition-transform duration-200 ${showTime ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        <AnimatePresence>
                            {showTime && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full bg-[#202024] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent)] transition-colors appearance-none"
                                        />
                                        <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-bold text-base uppercase tracking-wide shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
                    >
                        Add to Planner
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, toggleHabit, onDeleteHabit, onAddHabit, onAddTask, onScheduleTask }) => {
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitGoal, setNewHabitGoal] = useState(7);
    const [schedulingHabit, setSchedulingHabit] = useState<Habit | null>(null);

    const handleAddHabit = () => {
        if (newHabitName.trim() && onAddHabit) {
            onAddHabit(newHabitName, newHabitGoal);
            setNewHabitName('');
            setNewHabitGoal(7);
        }
    };

    const handleScheduleConfirm = (duration: number, priority: TaskType, date: Date, time?: string) => {
        if (!schedulingHabit || !onAddTask) return;

        console.log('[HabitTracker] scheduling habit:', schedulingHabit.name);

        // 1. Create the task
        const newTask = onAddTask(schedulingHabit.name, duration, priority);
        console.log('[HabitTracker] task created:', newTask.id, newTask.status);

        // 2. Schedule it with proper row mapping
        if (onScheduleTask) {
            // Map priority/category to GridRow
            let targetRow = 'WORK'; // Default

            // Explicit mapping to ensure string compatibility
            const p = priority as string;
            if (p === 'high') targetRow = 'FOCUS';
            else if (p === 'medium' || p === 'low' || p === 'backlog') targetRow = 'WORK';
            else if (p === 'leisure') targetRow = 'LEISURE';
            else if (p === 'chores') targetRow = 'CHORES';

            const scheduleDate = new Date(date);
            // Fix timezone offset issues by explicit date components
            // Default to 9 AM local time to ensure it lands on the calendar day correctly

            if (time) {
                const [hours, minutes] = time.split(':').map(Number);
                scheduleDate.setHours(hours, minutes);
            } else {
                scheduleDate.setHours(9, 0, 0, 0);
            }

            console.log('[HabitTracker] scheduling task to:', scheduleDate, targetRow);
            onScheduleTask(newTask.id, scheduleDate, targetRow as any, priority);
        } else {
            console.error('[HabitTracker] onScheduleTask prop is missing!');
        }
    };

    return (
        <div className="h-full overflow-y-auto flex-1 overflow-hidden relative pt-5 max-w-7xl mx-auto w-full">
            <AnimatePresence>
                {schedulingHabit && (
                    <ScheduleHabitModal
                        habitName={schedulingHabit.name}
                        onClose={() => setSchedulingHabit(null)}
                        onGenericSchedule={(duration, priority, date, time) => {
                            handleScheduleConfirm(duration, priority, date, time);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="mb-8 text-center px-4">
                <h2 className="text-3xl font-display font-bold text-white mb-1">Habit Tracker</h2>
                <p className="text-sm text-slate-500 font-medium">Track and reinforce your routines</p>
            </div>
            <div className="border rounded-3xl p-8 overflow-x-auto hidden md:block" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left py-4 px-4 uppercase text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>Habit</th>
                            {DAYS.map(d => (
                                <th key={d} className="text-center py-4 px-2 uppercase text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>{d}</th>
                            ))}
                            <th className="text-center py-4 px-4 uppercase text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => {
                            const streak = habit.checks.filter(Boolean).length;
                            const goal = habit.goal || 7;
                            const progress = Math.round((streak / goal) * 100);
                            const isGoalMet = streak >= goal;

                            return (
                                <tr key={habit.id} className="border-t transition-colors group" style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}>
                                    <td className="py-4 px-4 font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        {/* Schedule Button - Always Visible */}
                                        <button
                                            onClick={() => setSchedulingHabit(habit)}
                                            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                                            style={{ color: 'var(--text-muted)' }}
                                            title="Schedule this habit"
                                        >
                                            <CalendarClock size={16} />
                                        </button>

                                        {habit.name}
                                        {onDeleteHabit && (
                                            <button
                                                onClick={() => onDeleteHabit(habit.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 rounded transition-all ml-1"
                                                style={{ color: 'var(--text-muted)' }}
                                                title="Delete Habit"
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#fb7185'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                        <span className="text-[10px] font-normal ml-2" style={{ color: 'var(--text-muted)' }}>{streak} / {goal} this week</span>
                                    </td>
                                    {habit.checks.map((checked, i) => (
                                        <td key={i} className="py-4 px-2 text-center">
                                            <motion.button
                                                onClick={() => toggleHabit(habit.id, i)}
                                                whileTap={{ scale: 0.94 }}
                                                whileHover={{ scale: 1.05 }}
                                                animate={{
                                                    scale: checked ? [1, 1.02, 1] : 1,
                                                }}
                                                transition={{ duration: 0.14, ease: 'easeOut' }}
                                                className={`
                                                        w-8 h-8 rounded-lg transition-all duration-300 flex items-center justify-center mx-auto
                                                        ${checked
                                                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                        : 'bg-white/[0.05] text-transparent hover:bg-white/[0.1]'
                                                    }
                                                    `}
                                            >
                                                <CheckCircle2 size={16} strokeWidth={4} />
                                            </motion.button>
                                        </td>
                                    ))}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isGoalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-slate-300'}`}>
                                                {progress}%
                                            </span>
                                            <div className="w-16 h-1 bg-white/[0.15] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.min(100, progress)}%`,
                                                        backgroundColor: isGoalMet ? 'var(--success)' : 'var(--accent)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="mt-8 flex items-end gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">New Habit Name</label>
                        <input
                            type="text"
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                            placeholder="e.g. Gym, Reading..."
                            className="w-full bg-white/[0.03] border rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                        />
                    </div>
                    <div className="w-48 space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weekly Goal</label>
                            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{newHabitGoal} days</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="7"
                            value={newHabitGoal}
                            onChange={(e) => setNewHabitGoal(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--accent)' }}
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 px-1">
                            <span>1</span>
                            <span>7</span>
                        </div>
                    </div>
                    <button
                        onClick={handleAddHabit}
                        disabled={!newHabitName.trim()}
                        className="px-6 py-2.5 rounded-xl text-white font-bold text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                        style={{
                            backgroundColor: 'var(--accent)',
                            boxShadow: '0 10px 15px -3px var(--accent-muted)'
                        }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.filter = 'brightness(1.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                        }}
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>
            </div>

            {/* Mobile Habit List (today only) */}
            <div className="md:hidden space-y-3 px-2">
                {habits.map(habit => {
                    const today = getAdjustedDate();
                    const todayIndex = (today.getDay() + 6) % 7; // map Sunday=0 to 6 with Mon start
                    const checkedToday = habit.checks[todayIndex];
                    const streak = habit.checks.filter(Boolean).length;
                    return (
                        <div
                            key={habit.id}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
                        >
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSchedulingHabit(habit)}
                                        className="text-slate-400 hover:text-[var(--accent)]"
                                    >
                                        <CalendarClock size={14} />
                                    </button>
                                    <span className="font-semibold text-white text-sm truncate">{habit.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">Streak: {streak}</span>
                                </div>
                                <span className="text-[11px] text-slate-500 uppercase tracking-wider">Today</span>
                            </div>
                            <motion.button
                                onClick={() => toggleHabit(habit.id, todayIndex)}
                                whileTap={{ scale: 0.94 }}
                                whileHover={{ scale: 1.05 }}
                                animate={{
                                    scale: checkedToday ? [1, 1.02, 1] : 1,
                                }}
                                transition={{ duration: 0.14, ease: 'easeOut' }}
                                className={`
                                    w-12 h-12 rounded-xl transition-all duration-300 flex items-center justify-center
                                    ${checkedToday
                                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                        : 'bg-white/[0.05] text-transparent hover:bg-white/[0.1]'
                                    }
                                `}
                            >
                                <CheckCircle2 size={24} strokeWidth={4} />
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Add Habit */}
            <div className="md:hidden mt-6 space-y-3 px-2 pb-24">
                <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">New Habit Name</label>
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="e.g. Gym, Reading..."
                        className="w-full bg-white/[0.03] border rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                        style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weekly Goal</label>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{newHabitGoal} days</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="7"
                        value={newHabitGoal}
                        onChange={(e) => setNewHabitGoal(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--accent)' }}
                    />
                </div>
                <button
                    onClick={handleAddHabit}
                    disabled={!newHabitName.trim()}
                    className="w-full px-6 py-3 rounded-xl text-white font-bold text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg bg-[var(--accent)]"
                >
                    <Plus size={16} />
                    Add Habit
                </button>
            </div>
        </div>
    );
};
