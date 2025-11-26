import React, { useState } from 'react';
import { CheckCircle2, X, Plus } from 'lucide-react';
import { Habit } from '../../../types';
import { DAYS } from '../../../constants';

interface HabitTrackerProps {
    habits: Habit[];
    toggleHabit: (habitId: string, dayIndex: number) => void;
    onDeleteHabit?: (habitId: string) => void;
    onAddHabit?: (name: string, goal: number) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, toggleHabit, onDeleteHabit, onAddHabit }) => {
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitGoal, setNewHabitGoal] = useState(7);

    const handleAddHabit = () => {
        if (newHabitName.trim() && onAddHabit) {
            onAddHabit(newHabitName, newHabitGoal);
            setNewHabitName('');
            setNewHabitGoal(7);
        }
    };

    return (
        <div className="h-full p-8 overflow-y-auto">
            <h2 className="text-3xl font-display font-bold text-white mb-8">Habit Tracker</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left py-4 px-4 text-slate-500 uppercase text-xs tracking-wider">Habit</th>
                            {DAYS.map(d => (
                                <th key={d} className="text-center py-4 px-2 text-slate-500 uppercase text-xs tracking-wider">{d}</th>
                            ))}
                            <th className="text-center py-4 px-4 text-slate-500 uppercase text-xs tracking-wider">Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => {
                            const streak = habit.checks.filter(Boolean).length;
                            const goal = habit.goal || 7;
                            const progress = Math.round((streak / goal) * 100);
                            const isGoalMet = streak >= goal;

                            return (
                                <tr key={habit.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 px-4 font-bold text-slate-200 flex items-center gap-2">
                                        {habit.name}
                                        {onDeleteHabit && (
                                            <button
                                                onClick={() => onDeleteHabit(habit.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                                                title="Delete Habit"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                        <span className="text-[10px] text-slate-500 font-normal ml-2">Goal: {goal}/wk</span>
                                    </td>
                                    {habit.checks.map((checked, i) => (
                                        <td key={i} className="py-4 px-2 text-center">
                                            <button
                                                onClick={() => toggleHabit(habit.id, i)}
                                                className={`
                                                    w-8 h-8 rounded-lg transition-all duration-300 flex items-center justify-center mx-auto
                                                    ${checked
                                                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110'
                                                        : 'bg-white/[0.05] text-transparent hover:bg-white/[0.1]'
                                                    }
                                                `}
                                            >
                                                <CheckCircle2 size={16} strokeWidth={4} />
                                            </button>
                                        </td>
                                    ))}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isGoalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-slate-300'}`}>
                                                {progress}%
                                            </span>
                                            <div className="w-16 h-1 bg-white/[0.1] rounded-full overflow-hidden">
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
        </div>
    );
};
